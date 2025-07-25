// backend/server.js (Final Version - Serves API and Frontend)

// --- Core Node.js Modules ---
const path = require('path');

// --- Third-Party Packages ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// --- Local Application Modules ---
const passportConfig = require('./src/src/api/config/passport-config');
const userRoutes = require('./src/src/api/routes/userRoutes');
const authRoutes = require('./src/src/api/routes/authRoutes');
const stripeRoutes = require('./src/src/api/routes/stripeRoutes');

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        process.exit(1);
    });

// --- CORE MIDDLEWARE ---
// Your existing security policy is preserved.
app.use(helmet({ contentSecurityPolicy: false })); // Temporarily disable CSP for easier debugging, can be re-enabled later.
app.use(isProduction ? morgan('combined') : morgan('dev'));

// CORS for your API
const corsOptions = {
    origin: process.env.CLIENT_URL, // This should be your final domain: https://realmstoriches.xyz
    credentials: true,
};
app.use(cors(corsOptions));

// Body Parsers & Data Sanitization
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// --- SESSION & AUTHENTICATION MIDDLEWARE ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions', ttl: parseInt(process.env.SESSION_MAX_AGE, 10) / 1000 }),
    cookie: { maxAge: parseInt(process.env.SESSION_MAX_AGE, 10), secure: isProduction, httpOnly: true, sameSite: 'lax' }
}));
if (isProduction) {
    app.set('trust proxy', 1);
}
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// --- API ROUTES ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);


// =========================================================================
// --- SERVE THE BUILT REACT/HTML FRONTEND ---
// This is the new section that makes your server host the website.
// =========================================================================

// Define the path to the 'docs' folder, which is in the parent directory.
const staticFilesPath = path.resolve(__dirname, '..', 'docs');

// Serve all static files (JS, CSS, images) from the 'docs' folder.
app.use(express.static(staticFilesPath));
console.log(`Serving static files from: ${staticFilesPath}`);

// For any request that doesn't match an API route or a static file,
// send the main index.html file. This is crucial for single-page apps like React.
app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticFilesPath, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Error serving the page.');
        }
    });
});


// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(err.status || 500).json({ message: err.message || 'An unexpected server error occurred.' });
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));