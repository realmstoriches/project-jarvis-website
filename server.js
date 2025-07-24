// server.js (Final Production Version with Comprehensive CSP)

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
const passportConfig = require('./docs/src/api/config/passport-config');
const userRoutes = require('./docs/src/api/routes/userRoutes');
const authRoutes = require('./docs/src/api/routes/authRoutes');
const stripeRoutes = require('./docs/src/api/routes/stripeRoutes');

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

// --- COMPREHENSIVE HELMET & CSP CONFIGURATION ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Sets the default policy for fetching resources to only allow your own domain.
        defaultSrc: ["'self'"],
        
        // Defines allowed sources for scripts.
        scriptSrc: [
          "'self'",                         // Your own domain
          "https://www.googletagmanager.com", // For Google Analytics
          "https://js.stripe.com",            // For Stripe.js
          "https://cdn.tailwindcss.com",    // As seen in your errors
          "'unsafe-inline'",                  // Allows inline <script> tags. Necessary for GA and other snippets.
        ],

        // Defines allowed sources for styles.
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
        
        // Defines allowed sources for images.
        imgSrc: ["'self'", "data:"],

        // Defines allowed servers to connect to (for fetch/XHR/API calls).
        connectSrc: [
          "'self'",                         // Your own domain
          "https://generativelanguage.googleapis.com", // For Google Gemini API
          "https://www.google-analytics.com", // For Google Analytics to send data
        ],

        // Defines allowed sources for fonts.
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],

        // Defines which domains can embed this page in an iframe.
        frameSrc: [
          "'self'",                         // Your own domain
          "https://js.stripe.com",            // Allows Stripe's payment verification frames
        ],
        
        // This is the fix for the "inline event handler" errors.
        // It allows attributes like 'onclick'. This is needed for your current HTML.
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
  })
);

// Logging for HTTP requests
app.use(isProduction ? morgan('combined') : morgan('dev'));

// CORS CONFIGURATION
const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
};
app.use(cors(corsOptions));

// Body Parsers & Data Sanitization
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate Limiting for Auth Routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// SESSION & AUTHENTICATION MIDDLEWARE
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
        sameSite: isProduction ? 'none' : 'lax',
    }
}));
if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

// --- API ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

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