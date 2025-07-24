// docs/src/api/routes/stripeRoutes.js

const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// @route   POST /api/stripe/create-checkout-session
// @desc    Creates a Stripe checkout session for a logged-in user to subscribe.
// @access  Private
router.post(
    '/create-checkout-session',
    isAuthenticated,
    stripeController.createCheckoutSession
);

// @route   GET /api/stripe/plans
// @desc    Fetches the subscription plans from the Stripe Pricing Table.
// @access  Private
router.get(
    '/plans',
    isAuthenticated,
    stripeController.getSubscriptionPlans
);


// --- NEW WEBHOOK ROUTE ---
// @route   POST /api/stripe/webhook
// @desc    Handles incoming events from Stripe.
// @access  Public (Verification is handled by the stripe-signature header)
router.post(
    '/webhook',
    // IMPORTANT: We use express.raw to get the body as a buffer, which is required by Stripe
    express.raw({ type: 'application/json' }),
    stripeController.handleWebhook
);


module.exports = router;