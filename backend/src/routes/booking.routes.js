const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db/prisma');
const { optionalAuth, getEffectiveUser } = require('../middlewares/auth');
const { logger } = require('../middlewares/logger');
const { seatHoldService } = require('../services/seatHold.service');
const { websocketService } = require('../services/websocket.service');

const router = express.Router();

const createBookingSchema = z.object({
  idempotencyKey: z.string().min(8),
  movieId: z.coerce.number().int().positive(),
  movieTitle: z.string().min(1),
  showtime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO showtime date string',
  }),
  showId: z.string().optional(),
  seats: z.array(z.string().min(2)).min(1),
  totalAmount: z.coerce.number().positive(),
  status: z.enum(['PENDING_PAYMENT', 'CONFIRMED']).optional().default('PENDING_PAYMENT'),
});

const holdSeatsSchema = z.object({
  movieId: z.coerce.number().int().positive(),
  showtime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO showtime date string',
  }),
  showId: z.string().optional(),
  seats: z.array(z.string().min(2)).min(1),
});

/**
 * GET /api/v1/bookings/shows/:showId/occupancy
 * Returns concrete screening metadata, theater name, format, and real-time occupied/held seats
 */
router.get('/shows/:showId/occupancy', async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        screen: {
          include: {
            theater: true,
          },
        },
      },
    });

    if (!show) {
      return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Screening show not found' });
    }

    const reserved = await prisma.reservedSeat.findMany({
      where: {
        OR: [
          { showId },
          { movieId: show.movieId, showtime: show.startTime },
        ],
      },
      select: { seatCode: true },
    });

    const occupiedSeats = Array.from(new Set(reserved.map((r) => r.seatCode)));
    const heldSeats = await seatHoldService.getHeldSeats(show.movieId, show.startTime);

    res.json({
      showId: show.id,
      movieId: show.movieId,
      movieTitle: show.movieTitle,
      theaterName: show.screen.theater.name,
      city: show.screen.theater.city,
      screenName: show.screen.name,
      format: show.screen.format,
      startTime: show.startTime.toISOString(),
      basePrice: show.basePrice,
      totalSeats: show.screen.totalSeats,
      occupiedSeats,
      heldSeats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 1. GET /api/v1/bookings/occupied
 * Returns all seat identifiers currently confirmed for a given movieId and showtime,
 * plus active temporary holds.
 */
router.get('/occupied', async (req, res, next) => {
  try {
    const { movieId, showtime } = req.query;
    if (!movieId || !showtime) {
      return res.status(400).json({
        title: 'Bad Request',
        status: 400,
        detail: 'movieId and showtime query parameters are required.',
      });
    }

    const showtimeDate = new Date(showtime);
    if (isNaN(showtimeDate.getTime())) {
      return res.status(400).json({
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid showtime parameter.',
      });
    }

    // 1. Query normalized ReservedSeat records
    const reserved = await prisma.reservedSeat.findMany({
      where: {
        movieId: Number(movieId),
        showtime: showtimeDate,
      },
      select: { seatCode: true },
    });

    const occupiedSeats = new Set(reserved.map((r) => r.seatCode));

    // 2. Fallback check for legacy bookings if not yet backfilled
    const legacyBookings = await prisma.booking.findMany({
      where: {
        movieId: Number(movieId),
        showtime: showtimeDate,
        status: 'CONFIRMED',
      },
      select: { seats: true },
    });

    legacyBookings.forEach((b) => {
      b.seats.split(',').map((s) => s.trim()).filter(Boolean).forEach((seat) => {
        occupiedSeats.add(seat);
      });
    });

    // 3. Query active seat holds from Redis/Memory
    const heldSeats = await seatHoldService.getHeldSeats(Number(movieId), showtimeDate);

    res.json({
      movieId: Number(movieId),
      showtime: showtimeDate.toISOString(),
      occupiedSeats: Array.from(occupiedSeats),
      heldSeats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. POST /api/v1/bookings/hold
 * Atomically acquires a temporary 10-minute hold on requested seats in Redis/Memory
 * and broadcasts SEATS_HELD via WebSockets
 */
router.post('/hold', optionalAuth, async (req, res, next) => {
  try {
    const parse = holdSeatsSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid hold payload',
        errors: parse.error.format(),
      });
    }

    const user = await getEffectiveUser(req);
    const { movieId, showtime, seats } = parse.data;
    const showtimeDate = new Date(showtime);
    const requested = seats.map((s) => s.trim().toUpperCase());

    // 1. Verify seats are not already permanently confirmed in DB
    const confirmed = await prisma.reservedSeat.findMany({
      where: {
        movieId,
        showtime: showtimeDate,
        seatCode: { in: requested },
      },
      select: { seatCode: true },
    });

    if (confirmed.length > 0) {
      const taken = confirmed.map((c) => c.seatCode);
      return res.status(409).json({
        title: 'Seat Conflict',
        status: 409,
        detail: `The following seat(s) are already reserved: ${taken.join(', ')}`,
        conflictingSeats: taken,
      });
    }

    // 2. Acquire Redis/Memory hold
    const holdResult = await seatHoldService.holdSeats(movieId, showtimeDate, requested, user.id, 600);
    if (!holdResult.success) {
      return res.status(409).json({
        title: 'Seat Hold Conflict',
        status: 409,
        detail: `Seat(s) currently held by another user: ${holdResult.conflicts.join(', ')}`,
        conflictingSeats: holdResult.conflicts,
      });
    }

    // 3. Broadcast real-time seat lock to other clients
    websocketService.broadcast(movieId, showtimeDate, {
      type: 'SEATS_HELD',
      movieId,
      showtime: showtimeDate.toISOString(),
      seats: holdResult.heldSeats,
      userId: user.id,
      expiresAt: holdResult.expiresAt,
    });

    res.json({
      success: true,
      movieId,
      showtime: showtimeDate.toISOString(),
      heldSeats: holdResult.heldSeats,
      expiresAt: holdResult.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/v1/bookings/release
 * Releases a temporary hold if owned by the user, broadcasting SEATS_RELEASED
 */
router.post('/release', optionalAuth, async (req, res, next) => {
  try {
    const parse = holdSeatsSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid release payload',
        errors: parse.error.format(),
      });
    }

    const user = await getEffectiveUser(req);
    const { movieId, showtime, seats } = parse.data;
    const showtimeDate = new Date(showtime);
    const requested = seats.map((s) => s.trim().toUpperCase());

    const released = await seatHoldService.releaseSeats(movieId, showtimeDate, requested, user.id);

    if (released.length > 0) {
      websocketService.broadcast(movieId, showtimeDate, {
        type: 'SEATS_RELEASED',
        movieId,
        showtime: showtimeDate.toISOString(),
        seats: released,
        userId: user.id,
      });
    }

    res.json({
      success: true,
      releasedSeats: released,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. GET /api/v1/bookings
 * Retrieves all bookings for the active user (Clerk or Guest)
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const user = await getEffectiveUser(req);
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        show: {
          include: {
            screen: {
              include: {
                theater: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bookings.map((b) => ({
      ...b,
      seats: b.seats.split(',').map((s) => s.trim()),
      theater: b.show?.screen?.theater?.name || null,
      screen: b.show?.screen?.name || null,
      format: b.show?.screen?.format || null,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * 5. POST /api/v1/bookings
 * Idempotent ticket reservation with database-enforced atomic seat conflict protection
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const parse = createBookingSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid booking payload',
        errors: parse.error.format(),
      });
    }

    const user = await getEffectiveUser(req);
    const { idempotencyKey, movieId, movieTitle, showtime, showId, seats, totalAmount, status } = parse.data;
    const showtimeDate = new Date(showtime);
    const requestedSeats = seats.map((s) => s.trim().toUpperCase());

    // Resolve showId if not explicitly provided
    let resolvedShowId = showId || null;
    if (!resolvedShowId) {
      const matchedShow = await prisma.show.findFirst({
        where: { movieId, startTime: showtimeDate },
        select: { id: true },
      });
      if (matchedShow) {
        resolvedShowId = matchedShow.id;
      }
    }

    // 1. Idempotency Check: Return existing booking if key was already processed
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey },
      include: {
        reservedSeats: true,
        show: {
          include: {
            screen: {
              include: {
                theater: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      logger.info({ idempotencyKey, bookingId: existing.id }, 'Idempotent replay for booking request');
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(200).json({
        ...existing,
        seats: existing.seats.split(',').map((s) => s.trim()),
      });
    }

    // 2. Atomic Transaction: create Booking and insert ReservedSeat records concurrently
    try {
      const newBooking = await prisma.$transaction(async (tx) => {
        // Fast-path pre-check inside transaction
        const occupied = await tx.reservedSeat.findMany({
          where: {
            movieId,
            showtime: showtimeDate,
            seatCode: { in: requestedSeats },
          },
          select: { seatCode: true },
        });

        if (occupied.length > 0) {
          const conflicting = occupied.map((o) => o.seatCode);
          const conflictError = new Error(`The following seat(s) are already reserved: ${conflicting.join(', ')}`);
          conflictError.statusCode = 409;
          conflictError.conflictingSeats = conflicting;
          throw conflictError;
        }

        const created = await tx.booking.create({
          data: {
            userId: user.id,
            idempotencyKey,
            movieId,
            movieTitle,
            showtime: showtimeDate,
            showId: resolvedShowId,
            seats: requestedSeats.join(','),
            totalAmount,
            status,
            reservedSeats: {
              create: requestedSeats.map((seatCode) => ({
                movieId,
                showtime: showtimeDate,
                showId: resolvedShowId,
                seatCode,
              })),
            },
          },
          include: {
            reservedSeats: true,
            show: {
              include: {
                screen: {
                  include: {
                    theater: true,
                  },
                },
              },
            },
          },
        });

        return created;
      });

      // 3. Clear temporary hold and broadcast confirmed seats if status is CONFIRMED
      if (newBooking.status === 'CONFIRMED') {
        await seatHoldService.confirmSeats(movieId, showtimeDate, requestedSeats);
        websocketService.broadcast(movieId, showtimeDate, {
          type: 'SEATS_CONFIRMED',
          movieId,
          showtime: showtimeDate.toISOString(),
          seats: requestedSeats,
          bookingId: newBooking.id,
        });
      }

      logger.info({ bookingId: newBooking.id, movieId, seats: requestedSeats }, 'Successfully created movie ticket reservation');

      return res.status(201).json({
        ...newBooking,
        seats: requestedSeats,
      });
    } catch (txError) {
      // Catch Prisma compound unique constraint violation (P2002 on ReservedSeat [movieId, showtime, seatCode])
      if (txError.code === 'P2002') {
        logger.warn({ movieId, seats: requestedSeats }, 'Atomic seat collision caught by unique constraint (P2002)');
        return res.status(409).json({
          title: 'Seat Conflict',
          status: 409,
          detail: 'One or more of the selected seats were just reserved by another customer.',
          conflictingSeats: requestedSeats,
        });
      }

      if (txError.statusCode === 409) {
        return res.status(409).json({
          title: 'Seat Conflict',
          status: 409,
          detail: txError.message,
          conflictingSeats: txError.conflictingSeats || requestedSeats,
        });
      }

      throw txError;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * 6. DELETE /api/v1/bookings/:id
 * Cancels an existing user booking and releases reserved seats
 */
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const user = await getEffectiveUser(req);
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, userId: user.id },
    });

    if (!booking) {
      return res.status(404).json({
        title: 'Not Found',
        status: 404,
        detail: `Booking ${id} not found or does not belong to the user.`,
      });
    }

    const cancelledSeats = booking.seats.split(',').map((s) => s.trim());

    const updated = await prisma.$transaction(async (tx) => {
      // Release locked seat slots
      await tx.reservedSeat.deleteMany({
        where: { bookingId: id },
      });

      return await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    // Broadcast released seats so other active viewers can immediately book
    websocketService.broadcast(booking.movieId, booking.showtime, {
      type: 'SEATS_RELEASED',
      movieId: booking.movieId,
      showtime: new Date(booking.showtime).toISOString(),
      seats: cancelledSeats,
    });

    res.json({
      success: true,
      bookingId: id,
      status: updated.status,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
