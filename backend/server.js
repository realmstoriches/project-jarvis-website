// backend/server.js - FINAL, DEFINITIVE, INTEGRATED VERSION

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

// --- CORRECTED Local Application Module Paths ---
const passportConfig = require('./src/api/config/passport-config');
const userRoutes = require('./src/api/routes/userRoutes');
const authRoutes = require('./src/api/routes/authRoutes');
const stripeRoutes = require('./src/api/routes/stripeRoutes');

const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// --- PRESERVED: Your custom request logger ---
app.use((req, res, next) => {
    console.log(`[SERVER] INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
    next();
});

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        process.exit(1);
    });

// --- CORE MIDDLEWARE ---

// PRESERVED: Your specific Helmet and Content Security Policy configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://js.stripe.com"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
        connectSrc: ["'self'", "https://www.google-analytics.com", "https://generativelanguage.googleapis.com", "https://formspree.io", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https://*.stripe.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      },
    },
  })
);

app.use(isProduction ? morgan('combined') : morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// --- CRITICAL: Stripe webhook route must come BEFORE express.json() ---
// The '/api/stripe' path prefix is added here, and stripeRoutes handles the rest.
app.use('/api/stripe', stripeRoutes);

// Standard body parsers
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

// PRESERVED: Your API rate limiter
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

// Mount the rest of the API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// --- CORRECTED: Two-Frontend Static File Serving ---
const mainSiteBuildPath = path.resolve(__dirname, '..', 'main-site');
const jarvisAppBuildPath = path.resolve(__dirname, '..', 'react-app', 'dist');

// Serve the main website (index.html, styles, etc.) from the root
app.use(express.static(mainSiteBuildPath));
// Serve the built React app when the path starts with /jarvis-app
app.use('/jarvis-app', express.static(jarvisAppBuildPath));

// --- CORRECTED: SPA Catch-All Routes for Both Frontends ---
// This ensures that refreshing the page inside the iframe works correctly
app.get('/jarvis-app/*', (req, res) => {
    res.sendFile(path.join(jarvisAppBuildPath, 'index.html'));
});

// This is the final catch-all for the main site's pages
app.get('*', (req, res) => {
    res.sendFile(path.join(mainSiteBuildPath, 'index.html'));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));