// backend/src/api/config/passport-config.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

const LocalStrategy = require('passport-local').Strategy;
const User = require('../../models/User'); // This path should be correct

module.exports = function(passport) {
    passport.use(
        // Use 'email' as the username field.
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                // 1. Find the user by their email.
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    // If no user is found, it's an authentication failure.
                    return done(null, false, { message: 'Invalid credentials.' });
                }

                // 2. Use the custom comparePassword method from your User.js model.
                // This will correctly compare the submitted password with the hashed password in the DB.
                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    // If passwords match, authentication is successful.
                    return done(null, user);
                } else {
                    // If passwords do not match, it's an authentication failure.
                    return done(null, false, { message: 'Invalid credentials.' });
                }
            } catch (err) {
                // Handle any server errors.
                return done(err);
            }
        })
    );

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