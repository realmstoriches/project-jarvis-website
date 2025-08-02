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
        const customer = await stripe.customers.create({ email: email, name: email });
        console.log(`[Auth] Successfully created Stripe customer: ${customer.id}`);

        // Step 2: Create the user instance for Mongoose.
        const newUser = new User({
            email: email.toLowerCase(),
            password, // Provide the plain-text password here.
            subscription: {
                stripeCustomerId: customer.id,
                tier: 'free',
                status: 'active',
            },
        });

        // Step 3: Save the user. The 'pre-save' hook in your User.js model will AUTOMATICALLY hash the password.
        await newUser.save();
        console.log(`[Auth] User ${newUser.email} saved to database successfully.`);

        // Step 4: Automatically log the new user in.
        req.logIn(newUser, (err) => {
            if (err) {
                console.error('[Auth] Error logging in user after registration:', err);
                return next(err);
            }
            console.log(`[Auth] User ${newUser.email} logged in successfully after registration.`);
            return res.status(201).json({
                message: 'Registration successful!',
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    subscription: newUser.subscription,
                }
            });
        });

    } catch (error) {
        console.error('[Auth] Registration process failed:', error);
        return res.status(500).json({ message: 'An internal server error occurred during registration.' });
    }
});

// --- POST /api/auth/login ---
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
router.get('/session', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            user: { id: req.user.id, email: req.user.email, subscription: req.user.subscription }
        });
    } else {
        res.status(200).json({ user: null });
    }
});

module.exports = router;