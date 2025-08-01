// backend/src/api/routes/userRoutes.js - FINAL, PRODUCTION-READY

const express = require('express');
const Stripe = require('stripe');
const User = require('../../models/User'); // CORRECTED PATH

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// @route   POST /api/users/register
// @desc    Register a new user and create a Stripe customer
// @access  Public
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ message: 'Please provide a valid email and a password of at least 8 characters.' });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const customer = await stripe.customers.create({ email: email, name: email });

        const newUser = new User({
            email,
            password,
            subscription: { stripeCustomerId: customer.id, tier: 'free', status: 'none' }
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully. Please log in.' });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'An internal server error occurred during registration.' });
    }
});

// Note: The other user routes (getUsers, getUser) have been removed as they
// were not part of the core auth system and depended on the deleted controller.
// They can be added back here following the same pattern if needed.

module.exports = router;