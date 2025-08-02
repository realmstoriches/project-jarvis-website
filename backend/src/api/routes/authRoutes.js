// backend/src/api/routes/authRoutes.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

const express = require('express');
const passport = require('passport');
const User = require('../../models/User'); // Ensure this path is correct

// --- CRITICAL: Initialize Stripe for this route ---
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[CRITICAL] STRIPE_SECRET_KEY is not defined. User registration will fail.');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// --- POST /api/auth/register ---
// Handles new user registration, Stripe customer creation, and automatic login.
router.post('/register', async (req, res, next) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ message: 'Please provide a valid email and a password of at least 8 characters.' });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // Step 1: Create the Stripe Customer.
        console.log(`[Auth] Creating Stripe customer for email: ${email}`);
        const customer = await stripe.customers.create({
            email: email,
            name: email, // Use email as the name by default
        });
        console.log(`[Auth] Successfully created Stripe customer: ${customer.id}`);

        // Step 2: Create the user instance for Mongoose.
        const newUser = new User({
            email: email.toLowerCase(),
            subscription: {
                stripeCustomerId: customer.id,
                tier: 'free',
                status: 'active', // A new user is active by default
            },
        });

        // Step 3: Use the User model's static `register` method.
        // This is a method provided by passport-local-mongoose. It handles hashing the password
        // and saving the user in one step, preventing the plain-text password bug.
        User.register(newUser, password, (err, user) => {
            if (err) {
                console.error('[Auth] Error during User.register:', err);
                return res.status(500).json({ message: 'Error registering user.', error: err.message });
            }

            // Step 4: Log the new user in automatically.
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    console.error('[Auth] Error logging in user after registration:', loginErr);
                    return next(loginErr);
                }
                console.log(`[Auth] User ${user.email} registered and logged in successfully.`);
                return res.status(201).json({
                    message: 'Registration successful!',
                    user: {
                        id: user._id,
                        email: user.email,
                        subscription: user.subscription,
                    },
                });
            });
        });

    } catch (error) {
        console.error('[Auth] Registration process failed:', error);
        if (error.type === 'StripeCardError') {
             return res.status(400).json({ message: `Stripe error: ${error.message}` });
        }
        return res.status(500).json({ message: 'An internal server error occurred during registration.' });
    }
});

// --- POST /api/auth/login ---
// Uses a custom callback to provide more detailed responses.
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info.message || 'Invalid credentials.' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({
                user: { id: user.id, email: user.email, subscription: user.subscription }
            });
        });
    })(req, res, next);
});

// --- POST /api/auth/logout ---
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
            res.status(200).json({ message: 'Logout successful.' });
        });
    });
});

// --- GET /api/auth/session ---
// Checks if a user session is active.
router.get('/session', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            user: { id: req.user.id, email: req.user.email, subscription: req.user.subscription }
        });
    } else {
        // Return a 200 OK with user: null, which is a valid state for a guest.
        res.status(200).json({ user: null });
    }
});

module.exports = router;