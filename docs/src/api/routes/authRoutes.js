// docs/src/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const passport = require('passport');

// @route   POST /api/auth/login
// @desc    Log in a user and create a session
// @access  Public
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err); // Handle server errors
        }
        if (!user) {
            // Authentication failed, send back the message from passport-config (e.g., 'Invalid credentials.')
            return res.status(401).json({ message: info.message });
        }
        // Log the user in. This creates the session.
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            // Authentication successful
            return res.status(200).json({ 
                message: 'Login successful.',
                user: {
                    id: user.id,
                    email: user.email,
                    subscription: user.subscription // Send subscription status back to the client
                }
            });
        });
    })(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Log out the user and destroy the session
// @access  Private (requires user to be logged in)
router.post('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to destroy session.' });
            }
            res.clearCookie('connect.sid'); // The default session cookie name
            return res.status(200).json({ message: 'Logout successful.' });
        });
    });
});

// @route   GET /api/auth/status
// @desc    Check if a user is currently authenticated
// @access  Public
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({
            isAuthenticated: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                subscription: req.user.subscription
            }
        });
    } else {
        res.status(200).json({ isAuthenticated: false, user: null });
    }
});

module.exports = router;