// server.js (Production Ready - Final Version)

// --- Core Node.js Modules ---
const path = require('path');

// --- Third-Party Packages ---
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo'); // For persistent sessions
const helmet = require('helmet'); // For security headers
const morgan = require('morgan'); // For request logging
const mongoSanitize = require('express-mongo-sanitize'); // Security: NoSQL injection
const rateLimit = require('express-rate-limit'); // Security: Brute-force attacks

// --- Local Application Modules ---
const passportConfig = require('./docs/src/api/config/passport-config');
const userRoutes = require('./docs/src/api/routes/userRoutes');
const authRoutes = require('./docs/src/api/routes/authRoutes');

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    });

// --- CORE MIDDLEWARE ---

// 1. Security Headers with Helmet
app.use(helmet());

// 2. Request Logging with Morgan
app.use(isProduction ? morgan('combined') : morgan('dev'));

// 3. Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// 5. Rate Limiting for Auth Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// --- SESSION & AUTHENTICATION MIDDLEWARE ---

// 6. Session Management with Persistent Storage
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: parseInt(process.env.SESSION_MAX_AGE, 10) / 1000
    }),
    cookie: {
        maxAge: parseInt(process.env.SESSION_MAX_AGE, 10),
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// 7. Passport Initialization
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// --- API ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// --- SERVE STATIC FRONTEND ---
const staticFilesPath = path.resolve(__dirname, 'docs');
app.use(express.static(staticFilesPath));
console.log(`Serving static files from: ${staticFilesPath}`);

// SPA "Catch-all" Route
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
    res.status(err.status || 500).json({
        message: err.message || 'An unexpected server error occurred.',
        stack: isProduction ? '🥞' : err.stack
    });
});

// --- START SERVER ---
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));