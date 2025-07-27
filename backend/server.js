// backend/server.js - CORRECTED & SIMPLIFIED

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
// Your existing Helmet, Morgan, CORS, etc. are well-configured and preserved.
app.use(
  helmet({
    permissionPolicy: {
      policy: {
        payment: ["'self'", "https://js.stripe.com"],
      },
    },
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
          "https://formspree.io",
        ],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
  })
);
app.use(isProduction ? morgan('combined') : morgan('dev'));
// IMPORTANT: Ensure CLIENT_URL in your .env on Render is set to your frontend's public URL
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// --- Session & Auth Middleware ---
// Your existing session and passport setup is preserved.
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
// Your existing API routes are preserved.
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);


// =========================================================================
// --- SERVE BUILT FRONTEND STATIC FILES (SECTION REPLACED & SIMPLIFIED) ---
// =========================================================================
// 1. Define the path to the frontend's build output directory ('docs')
const frontendBuildPath = path.join(__dirname, '..', 'docs');
console.log(`[SERVER] Serving static files from: ${frontendBuildPath}`);

// 2. Use a single, powerful middleware to serve all static files.
// When a request comes in for /assets/index.js, this will find it.
app.use(express.static(frontendBuildPath));
// =========================================================================


// =========================================================================
// --- SPA CATCH-ALL ROUTE (SECTION REPLACED & SIMPLIFIED) ---
// =========================================================================
// This route MUST come AFTER your API routes and the static middleware.
// It handles any request that hasn't been handled yet (e.g., /dashboard, /login).
// It serves the main index.html, allowing React Router to take over.
app.get('*', (req, res) => {
    console.log(`[SERVER] Serving main index.html for SPA route: ${req.originalUrl}`);
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
// =========================================================================


// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));