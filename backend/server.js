// backend/server.js - COMPLETE VERBOSE LOGGING VERSION

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

// --- Local Application Modules ---
const passportConfig = require('./src/src/api/config/passport-config');
const userRoutes = require('./src/src/api/routes/userRoutes');
const authRoutes = require('./src/src/api/routes/authRoutes');
const stripeRoutes = require('./src/src/api/routes/stripeRoutes');

const app = express();
const PORT = process.env.PORT || 4242;
const isProduction = process.env.NODE_ENV === 'production';

// =========================================================================
// --- GATEKEEPER LOG: Logs EVERY request that hits the server ---
app.use((req, res, next) => {
    console.log(`[SERVER] INCOMING REQUEST: ${req.method} ${req.originalUrl}`);
    next();
});
// =========================================================================

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        process.exit(1);
    });

// --- CORE MIDDLEWARE ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.googletagmanager.com",
          "https://js.stripe.com",
          "https://cdn.tailwindcss.com",
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://stackpath.bootstrapcdn.com",
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://generativelanguage.googleapis.com",
        ],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
  })
);
app.use(isProduction ? morgan('combined') : morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// --- Session & Auth Middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions' }),
    cookie: { secure: isProduction, httpOnly: true, sameSite: 'lax' }
}));
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// --- API ROUTES ---
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

// --- SERVE BUILT FRONTEND STATIC FILES ---
const docsPath = path.resolve(__dirname, '..', 'docs');
console.log(`[SERVER] Serving static root from: ${docsPath}`);

const reactAssetsPath = path.resolve(docsPath, 'jarvis-app', 'assets');
console.log(`[SERVER] Serving React assets from: ${reactAssetsPath}`);
app.use('/jarvis-app/assets', express.static(reactAssetsPath));

app.use(express.static(docsPath));

// --- SPA CATCH-ALL ROUTE ---
app.get('*', (req, res) => {
    if (req.originalUrl.includes('.') && !req.originalUrl.includes('html')) {
        console.error(`[SERVER] CRITICAL ERROR: Catch-all is serving index.html for an asset request: ${req.originalUrl}`);
        // To be safe, we send a 404 for asset-like requests that weren't found by static handlers.
        res.status(404).send('Asset not found');
    } else {
        console.log(`[SERVER] Serving main index.html for SPA route: ${req.originalUrl}`);
        res.sendFile(path.resolve(docsPath, 'index.html'));
    }
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));