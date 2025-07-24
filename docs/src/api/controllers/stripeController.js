// docs/src/api/controllers/stripeController.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel'); // <-- ADD: We need the User model to update records

// @desc    Create a stripe checkout session for a subscription
// @route   POST /api/stripe/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
    // ... (existing createCheckoutSession function code)
    const user = req.user;
    const { priceId } = req.body;

    if (!priceId) {
        return res.status(400).json({ message: 'Price ID is required.' });
    }
    if (!user || !user.subscription || !user.subscription.stripeCustomerId) {
        return res.status(400).json({ message: 'User is not configured for payments. No Stripe Customer ID found.' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            customer: user.subscription.stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.YOUR_DOMAIN}/dashboard`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ message: 'Failed to create Stripe checkout session.', error: error.message });
    }
};

// @desc    Get subscription plans from the Stripe Pricing Table
// @route   GET /api/stripe/plans
// @access  Private (requires login to view plans)
exports.getSubscriptionPlans = async (req, res) => {
    // ... (existing getSubscriptionPlans function code)
    const pricingTableId = process.env.STRIPE_PRICING_TABLE_ID;
    
    if (!pricingTableId) {
        return res.status(500).json({ message: 'Stripe Pricing Table ID is not configured on the server.' });
    }

    try {
        const pricingTable = await stripe.pricingTables.retrieve(
            pricingTableId,
            { expand: ['line_items.data.price.product'] }
        );

        const plans = pricingTable.line_items.data.map(item => {
            const price = item.price;
            const product = price.product;
            return {
                id: price.id,
                name: product.name,
                description: product.description || 'No description provided.',
                price: price.unit_amount,
                currency: price.currency,
                interval: price.recurring ? price.recurring.interval : null,
            };
        });

        res.status(200).json(plans);
    } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        res.status(500).json({ message: 'Error retrieving subscription plans.', error: error.message });
    }
};


// --- NEW WEBHOOK FUNCTION ---
// @desc    Handle incoming webhooks from Stripe
// @route   POST /api/stripe/webhook
// @access  Public (but verified by Stripe signature)
exports.handleWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        // Use the raw body buffer for verification
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
        console.error(`❌ Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            console.log('✅ Checkout Session Completed for:', session.customer);
            
            // Find the user associated with this customer ID
            const user = await User.findOne({ 'subscription.stripeCustomerId': session.customer });
            
            if (user) {
                // Retrieve the subscription to get all details
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                
                // Update the user's subscription details in the database
                user.subscription.stripeSubscriptionId = subscription.id;
                user.subscription.subscriptionStatus = subscription.status; // should be 'active'
                user.subscription.tier = subscription.items.data[0].price.product.name.toLowerCase(); // Get product name as tier
                user.subscription.endDate = new Date(subscription.current_period_end * 1000); // Convert Unix timestamp to Date
                await user.save();
                console.log(`Database updated for user: ${user.email}`);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            console.log('🔄 Customer Subscription Updated:', subscription.id);

            // Find the user with this subscription ID
            const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });

            if (user) {
                user.subscription.subscriptionStatus = subscription.status; // e.g., 'active', 'past_due', 'canceled'
                user.subscription.endDate = new Date(subscription.current_period_end * 1000);
                if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
                   // Handle cancellation logic if needed, e.g., downgrade to free plan at period end
                   console.log(`Subscription for ${user.email} is set to cancel at period end.`);
                }
                await user.save();
                console.log(`Database updated for user: ${user.email}`);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            console.log('🗑️ Customer Subscription Deleted:', subscription.id);
            
            // Find the user and reset their subscription status
            const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });

            if (user) {
                user.subscription.subscriptionStatus = 'canceled';
                user.subscription.tier = 'free'; // Downgrade to free
                // You might want to keep the old subscription ID for historical records
                // user.subscription.stripeSubscriptionId = null;
                await user.save();
                console.log(`Subscription canceled and user ${user.email} downgraded to free.`);
            }
            break;
        }
        
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
};