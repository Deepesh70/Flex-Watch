const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db/prisma');
const { optionalAuth, getEffectiveUser } = require('../middlewares/auth');
const { logger } = require('../middlewares/logger');
const { paymentService } = require('../services/payment.service');

const router = express.Router();

const createSessionSchema = z.object({
  bookingId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const confirmSessionSchema = z.object({
  bookingId: z.string().min(1),
  sessionId: z.string().optional(),
});

/**
 * 1. GET /api/v1/payments/config
 * Returns client configuration status
 */
router.get('/config', (req, res) => {
  res.json({
    stripeConfigured: paymentService.isConfigured(),
  });
});

/**
 * 2. POST /api/v1/payments/create-checkout-session
 * Creates a Stripe hosted checkout session or sandbox checkout URL
 */
router.post('/create-checkout-session', optionalAuth, async (req, res, next) => {
  try {
    const parse = createSessionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid checkout session payload',
        errors: parse.error.format(),
      });
    }

    const user = await getEffectiveUser(req);
    const { bookingId, successUrl, cancelUrl } = parse.data;

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: user.id },
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
    });

    if (!booking) {
      return res.status(404).json({
        title: 'Not Found',
        status: 404,
        detail: `Booking ${bookingId} not found or does not belong to user.`,
      });
    }

    if (booking.status === 'CONFIRMED') {
      return res.status(400).json({
        title: 'Already Paid',
        status: 400,
        detail: 'This booking has already been paid and confirmed.',
      });
    }

    const session = await paymentService.createCheckoutSession({
      booking,
      successUrl,
      cancelUrl,
      customerEmail: user.email,
    });

    // Update booking with generated session ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.sessionId },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.sessionId,
      isMock: session.isMock,
      totalAmount: booking.totalAmount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/v1/payments/confirm-session
 * Called upon return from Stripe or sandbox checkout to sync booking status
 */
router.post('/confirm-session', optionalAuth, async (req, res, next) => {
  try {
    const parse = confirmSessionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid confirm session payload',
        errors: parse.error.format(),
      });
    }

    const { bookingId, sessionId } = parse.data;
    const result = await paymentService.handlePaymentSuccess(sessionId, null, { bookingId });

    if (!result) {
      return res.status(404).json({
        title: 'Not Found',
        status: 404,
        detail: 'Booking not found for session confirmation.',
      });
    }

    res.json({
      success: true,
      booking: {
        ...result.booking,
        seats: result.booking.seats.split(',').map((s) => s.trim()),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. POST /api/v1/payments/webhook
 * Stripe Webhook endpoint with cryptographic signature validation
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const rawBody = req.rawBody || req.body;

  let event;
  try {
    event = paymentService.verifyWebhookSignature(rawBody, sig);
  } catch (err) {
    logger.warn({ err: err.message }, 'Stripe webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await paymentService.handlePaymentSuccess(
          session.id,
          session.payment_intent,
          session.metadata
        );
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await paymentService.handlePaymentSuccess(
          null,
          paymentIntent.id,
          paymentIntent.metadata
        );
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        await paymentService.handlePaymentFailure(
          session.id,
          session.metadata,
          'Checkout session expired'
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await paymentService.handlePaymentFailure(
          null,
          paymentIntent.metadata,
          paymentIntent.last_payment_error?.message || 'Payment failed'
        );
        break;
      }
      default:
        logger.debug({ eventType: event.type }, 'Unhandled Stripe webhook event');
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed processing Stripe webhook');
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

module.exports = router;
