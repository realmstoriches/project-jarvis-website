// backend/server.js - FINAL PRODUCTION VERSION

const path = require('path');
require('dotenv').config();
const express = require('express');
const mongoose =require('mongoose');
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

// --- Core Middleware ---
app.use(helmet());
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

// =========================================================================
// --- API ROUTES (MUST BE BEFORE STATIC ROUTES) ---
// =========================================================================
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);


// =========================================================================
// --- SERVE BUILT FRONTEND STATIC FILES ---
// =========================================================================

// Define the path to the 'docs' folder, which is in the parent directory.
const docsPath = path.resolve(__dirname, '..', 'docs');
console.log(`Serving static files from root: ${docsPath}`);

// Serve all static files from the 'docs' folder (for your main site).
app.use(express.static(docsPath));

// Also serve the assets for the nested React app correctly.
// This specifically maps the /jarvis-app/assets URL path to the correct folder on the server.
const reactAssetsPath = path.resolve(docsPath, 'jarvis-app', 'assets');
console.log(`Serving React app assets from: ${reactAssetsPath}`);
app.use('/jarvis-app/assets', express.static(reactAssetsPath));


// --- SPA CATCH-ALL ROUTE ---
// For any request that doesn't match an API route or a static file, send the main index.html.
// This allows your client-side routers to take over.
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