// docs/src/api/middleware/authMiddleware.js

// This middleware checks if a user is authenticated.
// We will use it to protect routes that should only be accessible to logged-in users.
const isAuthenticated = (req, res, next) => {
    // Passport.js adds the isAuthenticated() method to the request object.
    // If it returns true, the user is logged in.
    if (req.isAuthenticated()) {
        // The user is authenticated, so we can proceed to the next function in the chain.
        return next();
    }

    // If the user is not authenticated, we send a 401 Unauthorized status
    // and a JSON response.
    res.status(401).json({ message: 'Unauthorized. You must be logged in to perform this action.' });
};

module.exports = { isAuthenticated };