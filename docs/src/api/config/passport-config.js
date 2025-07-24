// docs/src/api/config/passport-config.js

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/userModel'); // Adjust path to your User model

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                // 1. Find the user by email
                const user = await User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    // We use a generic message to avoid revealing if an email is registered
                    return done(null, false, { message: 'Invalid credentials.' });
                }

                // 2. Compare the provided password with the hashed password in the database
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    // Passwords match, authentication successful
                    return done(null, user);
                } else {
                    // Passwords do not match
                    return done(null, false, { message: 'Invalid credentials.' });
                }
            } catch (err) {
                return done(err); // Server error
            }
        })
    );

    // 3. Serialize user to store in the session
    // This determines which data of the user object should be stored in the session.
    // Storing the user ID is a common and secure practice.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // 4. Deserialize user from the session
    // When a request comes in, this uses the ID stored in the session to fetch
    // the full user object from the database, making it available on `req.user`.
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};