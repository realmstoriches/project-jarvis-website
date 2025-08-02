// backend/src/api/config/passport-config.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User');

module.exports = function(passport) {
    // --- CORRECTED: Use the User.authenticate() method provided by passport-local-mongoose ---
    // This correctly handles hashing and comparing passwords behind the scenes.
    passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));

    // These functions are correct and do not need changes.
    // They tell Passport how to store and retrieve user data from the session.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};