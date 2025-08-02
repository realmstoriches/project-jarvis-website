// backend/server.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

const path = require('path');
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

const passportConfig = require('./src/api/config/passport-config');
const userRoutes = require('./src/api/routes/userRoutes');
const authRoutes = require('./src/api/routes/authRoutes');
const stripeRoutes = require('./src/api/routes/stripeRoutes');

const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[SUCCESS] MongoDB connected successfully.'))
    .catch(err => {
        console.error('[CRITICAL] MongoDB connection error:', err);
        process.exit(1);
    });

// --- Core Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.googletagmanager.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
            connectSrc: ["'self'", "https://api.stripe.com", "https://generativelanguage.googleapis.com", "https://www.google-analytics.com", "https://formspree.io", `ws://localhost:${PORT}`],
            imgSrc: ["'self'", "data:", "https://*.stripe.com", "https://*.stripecdn.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        },
    },
}));
app.use(isProduction ? morgan('combined') : morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use('/api/stripe', stripeRoutes);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// --- Session & Auth Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions' }),
    cookie: { secure: isProduction, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// --- API ROUTES ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// =========================================================================
// --- CORRECTED STATIC FILE SERVING ---
// =========================================================================

// Define the absolute paths to your build directories.
const mainSiteBuildPath = path.resolve(__dirname, '..', 'main-site');
const jarvisAppBuildPath = path.resolve(__dirname, '..', 'react-app', 'dist');

console.log(`[INFO] Serving main site from: ${mainSiteBuildPath}`);
console.log(`[INFO] Serving Jarvis app from: ${jarvisAppBuildPath}`);

// 1. Serve the Jarvis App under the '/jarvis-app' route
app.use('/jarvis-app', express.static(jarvisAppBuildPath));

// 2. Serve all assets for the main site from the root
app.use(express.static(mainSiteBuildPath));

// 3. SPA Catch-All for the Jarvis App
app.get('/jarvis-app/*', (req, res) => {
    res.sendFile(path.join(jarvisAppBuildPath, 'index.html'));
});

// 4. Main Site Catch-All (This MUST be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(mainSiteBuildPath, 'index.html'));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => console.log(`[SUCCESS] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));