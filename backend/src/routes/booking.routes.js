const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db/prisma');
const { optionalAuth } = require('../middlewares/auth');
const { logger } = require('../middlewares/logger');

const router = express.Router();

const createBookingSchema = z.object({
  idempotencyKey: z.string().min(8),
  movieId: z.coerce.number().int().positive(),
  movieTitle: z.string().min(1),
  showtime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO showtime date string',
  }),
  seats: z.array(z.string().min(2)).min(1),
  totalAmount: z.coerce.number().positive(),
});

// Helper to determine active userId (Clerk authenticated user or Guest UUID)
async function getEffectiveUser(req) {
  if (req.user) return req.user;

  const guestId = req.headers['x-guest-id'];
  if (!guestId) {
    const error = new Error('Authentication or guest identifier (x-guest-id header) is required.');
    error.status = 401;
    throw error;
  }

  return await prisma.user.upsert({
    where: { clerkId: guestId },
    update: {},
    create: { clerkId: guestId, name: 'Guest User' },
  });
}

/**
 * 1. GET /api/v1/bookings/occupied
 * Returns all seat identifiers currently confirmed for a given movieId and showtime
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

    // Find confirmed bookings for this movie & showtime
    const bookings = await prisma.booking.findMany({
      where: {
        movieId: Number(movieId),
        showtime: showtimeDate,
        status: 'CONFIRMED',
      },
      select: { seats: true },
    });

    // Flatten comma-separated seat strings into unique list
    const occupiedSeats = new Set();
    bookings.forEach((b) => {
      b.seats.split(',').map((s) => s.trim()).filter(Boolean).forEach((seat) => {
        occupiedSeats.add(seat);
      });
    });

    res.json({
      movieId: Number(movieId),
      showtime: showtimeDate.toISOString(),
      occupiedSeats: Array.from(occupiedSeats),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/v1/bookings
 * Retrieves all bookings for the active user (Clerk or Guest)
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const user = await getEffectiveUser(req);
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = bookings.map((b) => ({
      ...b,
      seats: b.seats.split(',').map((s) => s.trim()),
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/v1/bookings
 * Idempotent ticket reservation with seat conflict protection
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
    const { idempotencyKey, movieId, movieTitle, showtime, seats, totalAmount } = parse.data;
    const showtimeDate = new Date(showtime);

    // 1. Idempotency Check: Return existing booking if key was already processed
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      logger.info({ idempotencyKey, bookingId: existing.id }, 'Idempotent replay for booking request');
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(200).json({
        ...existing,
        seats: existing.seats.split(',').map((s) => s.trim()),
      });
    }

    // 2. Seat Conflict Check: Atomic conflict prevention
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        movieId,
        showtime: showtimeDate,
        status: 'CONFIRMED',
      },
      select: { seats: true },
    });

    const alreadyTaken = new Set();
    confirmedBookings.forEach((b) => {
      b.seats.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => alreadyTaken.add(s));
    });

    const requestedSeats = seats.map((s) => s.trim().toUpperCase());
    const conflicts = requestedSeats.filter((s) => alreadyTaken.has(s));

    if (conflicts.length > 0) {
      return res.status(409).json({
        title: 'Seat Conflict',
        status: 409,
        detail: `The following seat(s) are already reserved: ${conflicts.join(', ')}`,
        conflictingSeats: conflicts,
      });
    }

    // 3. Create Booking Record
    const newBooking = await prisma.booking.create({
      data: {
        userId: user.id,
        idempotencyKey,
        movieId,
        movieTitle,
        showtime: showtimeDate,
        seats: requestedSeats.join(','),
        totalAmount,
        status: 'CONFIRMED',
      },
    });

    logger.info({ bookingId: newBooking.id, movieId, seats: requestedSeats }, 'Successfully created movie ticket reservation');

    res.status(201).json({
      ...newBooking,
      seats: requestedSeats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. DELETE /api/v1/bookings/:id
 * Cancels an existing user booking
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

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
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
