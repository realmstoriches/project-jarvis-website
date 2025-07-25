// server.js (Final Production Version with Corrected Nested Paths)

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

// --- Local Application Modules (PATHS CORRECTED FOR NESTED SRC) ---
// The paths now correctly point to the second 'src' directory.
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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://js.stripe.com", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://www.google-analytics.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
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
// These routes will now be found correctly.
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

// --- SERVER HEALTH CHECK ROUTE ---
app.get('/api', (req, res) => {
    res.json({ status: 'success', message: 'Realms to Riches API is running.' });
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