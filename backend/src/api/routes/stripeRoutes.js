// backend/src/api/routes/stripeRoutes.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

const express = require('express');
const Stripe = require('stripe');
const User = require('../../models/User');

// --- CRITICAL: Check for Stripe keys at startup to prevent silent failures ---
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[CRITICAL] STRIPE_SECRET_KEY is not defined in the environment. Stripe functionality will fail.');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[CRITICAL] STRIPE_WEBHOOK_SECRET is not defined in the environment. Webhook processing will fail.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Self-contained middleware to protect routes that require an authenticated user.
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: You must be logged in to perform this action.' });
};

// --- CORRECTED: The /plans route is now PUBLIC. ---
// Any user, authenticated or not, should be able to see the available plans.
router.get('/plans', async (req, res) => {
    try {
        const products = await stripe.products.list({
            active: true,
            expand: ['data.default_price']
        });

        const plans = products.data.map(product => {
            const price = product.default_price;
            // Add robust checks to prevent crashes if a product is misconfigured in Stripe
            if (typeof price !== 'object' || price === null || !price.id || price.unit_amount === null || !price.recurring?.interval) {
                console.warn(`[Stripe] Skipping misconfigured product: ${product.id} - ${product.name}`);
                return null;
            }
            return {
                id: price.id,
                name: product.name,
                description: product.description || '',
                price: price.unit_amount,
                currency: price.currency,
                interval: price.recurring.interval,
            };
        }).filter(Boolean); // Filter out any null (misconfigured) products

        res.status(200).json(plans);
    } catch (error) {
        console.error('[Stripe API Error] Failed to fetch plans:', error.message);
        res.status(500).json({ message: 'An internal error occurred while fetching subscription plans.' });
    }
});

// This route correctly remains PROTECTED. Only logged-in users can create a checkout session.
router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
    const { priceId } = req.body;
    if (!priceId) {
        return res.status(400).json({ message: 'Price ID is required.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.subscription.stripeCustomerId) {
            return res.status(404).json({ message: 'Stripe customer ID not found for this user.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: user.subscription.stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/#/payment-status?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/#/payment-status`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('[Stripe API Error] Failed to create checkout session:', error.message);
        res.status(500).json({ message: 'An internal error occurred while creating the checkout session.' });
    }
});

// This route correctly remains PUBLIC and uses raw body parsing for webhook verification.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`[Stripe Webhook Error] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const session = event.data.object;
        if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const stripeCustomerId = session.customer;
            // Correctly retrieve product name from the line items for checkout sessions
            const lineItem = session.line_items?.data[0];
            const price = lineItem?.price;
            const product = price ? await stripe.products.retrieve(price.product) : null;
            const planName = product ? product.name : 'free';
            
            await User.findOneAndUpdate(
                { 'subscription.stripeCustomerId': stripeCustomerId },
                {
                    'subscription.subscriptionId': session.subscription || session.id,
                    'subscription.status': session.status,
                    'subscription.tier': planName.toLowerCase(),
                    'subscription.currentPeriodEnds': session.current_period_end ? new Date(session.current_period_end * 1000) : null,
                },
                { new: true }
            );
        }
    } catch (error) {
        console.error('[Stripe Webhook Error] Handler failed:', error);
        return res.status(500).json({ message: "An internal error occurred while processing webhook event." });
    }

    res.status(200).json({ received: true });
});

module.exports = router;