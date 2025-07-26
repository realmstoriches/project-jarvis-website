// backend/server.js - FINAL VERSION WITH CORRECT CSP

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

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('CRITICAL: MongoDB connection error:', err);
        process.exit(1);
    });

// --- CORE MIDDLEWARE ---

// =========================================================================
// --- NEW, COMPREHENSIVE HELMET & CSP CONFIGURATION ---
// This replaces the simple app.use(helmet());
// =========================================================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Default policy: only allow from our domain
        scriptSrc: [
          "'self'", // Allow scripts from our domain
          "'unsafe-inline'", // Allow inline <script> tags (for Google Analytics)
          "https://www.googletagmanager.com", // Allow Google Analytics script
          "https://js.stripe.com", // Allow Stripe's pricing table script
        ],
        styleSrc: [
          "'self'", // Allow stylesheets from our domain
          "'unsafe-inline'", // Allow inline styles and the 'onload' CSS trick
          "https://cdnjs.cloudflare.com", // Allow Font Awesome
          "https://stackpath.bootstrapcdn.com", // Allow Bootstrap
        ],
        connectSrc: [
          "'self'", // Allow API calls to our own domain
          "https://www.google-analytics.com", // Allow Google Analytics to send data
        ],
        imgSrc: ["'self'", "data:"], // Allow images from our domain and data URIs
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"], // Allow fonts from Font Awesome
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
app.use(express.static(docsPath));
const reactAssetsPath = path.resolve(docsPath, 'jarvis-app', 'assets');
app.use('/jarvis-app/assets', express.static(reactAssetsPath));

// --- SPA CATCH-ALL ROUTE ---
app.get('*', (req, res) => {
    res.sendFile(path.resolve(docsPath, 'index.html'));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR HANDLER:", err.stack);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));