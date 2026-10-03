const crypto = require('crypto');
const Stripe = require('stripe');
const { env } = require('../config/env');
const { prisma } = require('../db/prisma');
const { logger } = require('../middlewares/logger');
const { seatHoldService } = require('./seatHold.service');
const { websocketService } = require('./websocket.service');

class PaymentService {
  constructor() {
    this.stripe = env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.startsWith('sk_')
      ? new Stripe(env.STRIPE_SECRET_KEY)
      : null;
  }

  isConfigured() {
    return Boolean(this.stripe);
  }

  /**
   * Generates a hosted Stripe Checkout session or a sandbox simulator URL
   */
  async createCheckoutSession({ booking, successUrl, cancelUrl, customerEmail }) {
    const seatsList = booking.seats.split(',').map((s) => s.trim()).join(', ');
    const theaterName = booking.show?.screen?.theater?.name || 'Flex-Watch Cinema';
    const screenFormat = booking.show?.screen?.format || 'Standard';

    // 1. Live Stripe Checkout Session
    if (this.isConfigured()) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: customerEmail || undefined,
          client_reference_id: booking.id,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${booking.movieTitle} - Admission Ticket`,
                  description: `${theaterName} (${screenFormat}) • Seats: ${seatsList}`,
                },
                unit_amount: Math.round(booking.totalAmount * 100),
              },
              quantity: 1,
            },
          ],
          metadata: {
            bookingId: booking.id,
            movieId: String(booking.movieId),
            showtime: booking.showtime.toISOString(),
            seats: booking.seats,
          },
          success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
          cancel_url: `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}booking_id=${booking.id}`,
        });

        logger.info({ bookingId: booking.id, stripeSessionId: session.id }, 'Created live Stripe Checkout session');
        return {
          url: session.url,
          sessionId: session.id,
          isMock: false,
        };
      } catch (err) {
        logger.error({ err: err.message, bookingId: booking.id }, 'Stripe API checkout creation failed, falling back to simulated session');
      }
    }

    // 2. Simulated Sandbox Mode (when running without live Stripe keys)
    const mockSessionId = `cs_sandbox_${crypto.randomBytes(12).toString('hex')}`;
    const separator = successUrl.includes('?') ? '&' : '?';
    const simulatedUrl = `${successUrl}${separator}session_id=${mockSessionId}&booking_id=${booking.id}&mock_checkout=true`;

    logger.info({ bookingId: booking.id, mockSessionId }, 'Generated sandbox simulated checkout session');
    return {
      url: simulatedUrl,
      sessionId: mockSessionId,
      isMock: true,
    };
  }

  /**
   * Cryptographically verifies Stripe signature from raw payload buffer
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (this.isConfigured() && env.STRIPE_WEBHOOK_SECRET) {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signatureHeader,
        env.STRIPE_WEBHOOK_SECRET
      );
    }

    // Local / Sandbox mock fallback: parse raw body safely
    try {
      const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
      return parsed;
    } catch (e) {
      throw new Error('Failed to parse webhook payload');
    }
  }

  /**
   * State Machine: Transitions Booking from PENDING_PAYMENT to CONFIRMED
   */
  async handlePaymentSuccess(sessionId, paymentIntentId, rawMetadata = {}) {
    // 1. Locate booking by stripeSessionId or metadata.bookingId
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(sessionId ? [{ stripeSessionId: sessionId }] : []),
          ...(rawMetadata?.bookingId ? [{ id: rawMetadata.bookingId }] : []),
        ],
      },
    });

    if (!booking) {
      logger.warn({ sessionId, bookingId: rawMetadata?.bookingId }, 'Payment success received for unknown booking');
      return null;
    }

    // 2. Idempotency Check: Already confirmed bookings are safely replayed
    if (booking.status === 'CONFIRMED') {
      logger.info({ bookingId: booking.id }, 'Payment success replayed for already confirmed booking');
      return { success: true, booking, alreadyConfirmed: true };
    }

    const seatsList = booking.seats.split(',').map((s) => s.trim().toUpperCase());

    // 3. Atomic transition: Mark booking CONFIRMED and record paymentIntentId
    const confirmedBooking = await prisma.$transaction(async (tx) => {
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paymentIntentId: paymentIntentId || `pi_sim_${Date.now()}`,
          stripeSessionId: sessionId || booking.stripeSessionId,
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
    });

    // 4. Confirm permanent hold and broadcast confirmation via WebSockets
    await seatHoldService.confirmSeats(booking.movieId, booking.showtime, seatsList);
    websocketService.broadcast(booking.movieId, booking.showtime, {
      type: 'SEATS_CONFIRMED',
      movieId: booking.movieId,
      showtime: booking.showtime.toISOString(),
      seats: seatsList,
      bookingId: booking.id,
    });

    logger.info(
      { bookingId: booking.id, seats: seatsList, amount: booking.totalAmount },
      'Successfully confirmed booking after payment receipt'
    );

    return {
      success: true,
      booking: confirmedBooking,
      alreadyConfirmed: false,
    };
  }

  /**
   * State Machine: Transitions Booking from PENDING_PAYMENT to CANCELLED and frees seats
   */
  async handlePaymentFailure(sessionId, rawMetadata = {}, reason = 'Payment failed or cancelled') {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(sessionId ? [{ stripeSessionId: sessionId }] : []),
          ...(rawMetadata?.bookingId ? [{ id: rawMetadata.bookingId }] : []),
        ],
      },
    });

    if (!booking || booking.status === 'CANCELLED') {
      return null;
    }

    const seatsList = booking.seats.split(',').map((s) => s.trim().toUpperCase());

    // Delete reserved seats and mark CANCELLED so other customers can reserve them
    const cancelledBooking = await prisma.$transaction(async (tx) => {
      await tx.reservedSeat.deleteMany({
        where: { bookingId: booking.id },
      });

      return tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });
    });

    // Release any temporary holds and broadcast SEATS_RELEASED
    await seatHoldService.releaseSeats(booking.movieId, booking.showtime, seatsList, booking.userId);
    websocketService.broadcast(booking.movieId, booking.showtime, {
      type: 'SEATS_RELEASED',
      movieId: booking.movieId,
      showtime: booking.showtime.toISOString(),
      seats: seatsList,
      userId: booking.userId,
    });

    logger.info({ bookingId: booking.id, reason }, 'Cancelled booking and released reserved seats');
    return cancelledBooking;
  }
}

const paymentService = new PaymentService();

module.exports = {
  PaymentService,
  paymentService,
};
