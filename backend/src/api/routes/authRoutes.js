// backend/src/api/routes/authRoutes.js - FINAL, PRODUCTION-READY

const express = require('express');
const passport = require('passport');
const router = express.Router();

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) { return res.status(401).json({ message: info.message }); }
        req.logIn(user, (err) => {
            if (err) { return next(err); }
            return res.status(200).json({
                user: { id: user.id, email: user.email, subscription: user.subscription }
            });
        });
    })(req, res, next);
});

router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Logout successful.' });
        });
    });
});

// CORRECTED: Endpoint is now /session to match the frontend call
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