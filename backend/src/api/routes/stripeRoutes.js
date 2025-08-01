// backend/src/api/routes/stripeRoutes.js - FINAL, PRODUCTION-READY

const express = require('express');
const Stripe = require('stripe');
const User = require('../../models/User'); // CORRECTED PATH

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Self-contained middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: You must be logged in to perform this action.' });
};

router.get('/plans', isAuthenticated, async (req, res) => {
    try {
        const products = await stripe.products.list({ active: true, expand: ['data.default_price'] });
        const plans = products.data.map(p => ({
            id: p.default_price.id,
            name: p.name,
            description: p.description,
            price: p.default_price.unit_amount,
            currency: p.default_price.currency,
            interval: p.default_price.recurring.interval,
        }));
        res.json(plans);
    } catch (error) {
        console.error('Error fetching Stripe plans:', error);
        res.status(500).json({ message: 'Failed to fetch subscription plans.' });
    }
});

router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
    const { priceId } = req.body;
    if (!priceId) { return res.status(400).json({ message: 'Price ID is required.' }); }

    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.subscription.stripeCustomerId) {
            return res.status(404).json({ message: 'User or Stripe customer not found.' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: user.subscription.stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/#/payment-status?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/#/payment-status`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Failed to create checkout session.' });
    }
});

// THIS ROUTE IS PUBLIC AND IS MOUNTED SEPARATELY IN SERVER.JS
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const sub = event.data.object;
            const stripeCustomerId = sub.customer;
            const planName = sub.items && sub.items.data.length > 0 ? (await stripe.products.retrieve(sub.items.data[0].price.product)).name : 'free';
            
            await User.findOneAndUpdate(
                { 'subscription.stripeCustomerId': stripeCustomerId },
                {
                    'subscription.subscriptionId': sub.id,
                    'subscription.status': sub.status,
                    'subscription.tier': planName.toLowerCase(),
                    'subscription.currentPeriodEnds': sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
                },
                { new: true }
            );
        }
    } catch (error) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({ message: "Error processing webhook event." });
    }

    res.status(200).json({ received: true });
});

module.exports = router;