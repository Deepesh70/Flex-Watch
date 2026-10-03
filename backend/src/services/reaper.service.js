const { prisma } = require('../db/prisma');
const { logger } = require('../middlewares/logger');
const { seatHoldService } = require('./seatHold.service');
const { websocketService } = require('./websocket.service');

class ReaperService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Sweeps expired PENDING_PAYMENT bookings and frees seats
   * @param {number} maxAgeSeconds - age threshold in seconds (defaults to 600s / 10 minutes)
   */
  async reapExpiredBookings(maxAgeSeconds = 600) {
    if (this.isRunning) return { reaped: 0 };
    this.isRunning = true;

    try {
      const cutoffTime = new Date(Date.now() - maxAgeSeconds * 1000);

      // Find all abandoned bookings
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING_PAYMENT',
          createdAt: { lt: cutoffTime },
        },
        include: {
          reservedSeats: true,
        },
      });

      if (expiredBookings.length === 0) {
        return { reaped: 0 };
      }

      logger.info({ count: expiredBookings.length }, 'Reaping expired pending bookings');

      let reapedCount = 0;

      for (const booking of expiredBookings) {
        try {
          const seatsList = booking.seats.split(',').map((s) => s.trim().toUpperCase());

          // Atomic cleanup: remove reserved seats and mark booking EXPIRED
          await prisma.$transaction(async (tx) => {
            await tx.reservedSeat.deleteMany({
              where: { bookingId: booking.id },
            });
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: 'EXPIRED' },
            });
          });

          // Free in-memory or Redis temporary hold
          await seatHoldService.releaseSeats(
            booking.movieId,
            booking.showtime,
            seatsList,
            booking.userId
          );

          // Broadcast real-time release event over WebSockets
          websocketService.broadcast(booking.movieId, booking.showtime, {
            type: 'SEATS_RELEASED',
            movieId: booking.movieId,
            showtime: booking.showtime.toISOString(),
            seats: seatsList,
            reason: 'HOLD_EXPIRED',
          });

          reapedCount++;
          logger.info(
            { bookingId: booking.id, seats: seatsList },
            'Reaped expired booking and restored seats to inventory'
          );
        } catch (bookingErr) {
          logger.error({ err: bookingErr.message, bookingId: booking.id }, 'Error reaping individual booking');
        }
      }

      return { reaped: reapedCount };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed during expired booking reaping sweep');
      return { reaped: 0, error: err.message };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Starts periodic background sweeping
   */
  start(intervalMs = 60000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.reapExpiredBookings().catch((err) => {
        logger.error({ err: err.message }, 'Background reaper cron error');
      });
    }, intervalMs);
    logger.info({ intervalMs }, 'Expired booking background sweeper started');
  }

  /**
   * Stops background sweeper
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Expired booking background sweeper stopped');
    }
  }
}

const reaperService = new ReaperService();

module.exports = {
  ReaperService,
  reaperService,
};
