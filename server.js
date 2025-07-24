// server.js (Production Ready - Final Version with Full CSP)

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

// --- HELMET & CONTENT SECURITY POLICY (CSP) CONFIGURATION ---
// This replaces the simple app.use(helmet()) to allow necessary external resources.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Allow scripts from your own domain, Google, and Stripe.
        // The 'sha256-...' hash is for your specific inline Google Analytics script.
        scriptSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "https://js.stripe.com",
          "'sha256-BhiNEcto1yViO8e5aYDwb+4n0cLxYW+eXbmqeQI5eMo='", // Hash for your inline GA script
        ],
        // Allow styles from your own domain and trusted CDNs. 'unsafe-inline' is often needed for libraries like Bootstrap.
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"],
        // Allow images from your own domain and data sources (for base64 images).
        imgSrc: ["'self'", "data:"],
        // Allow API calls to your own domain and the Google Generative AI service.
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
        // Allow fonts from trusted CDNs.
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        // Allow your site to be embedded in an iframe on its own origin (if needed).
        frameSrc: ["'self'"],
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