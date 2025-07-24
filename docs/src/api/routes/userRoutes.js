// docs/src/api/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// --- NEW ---
// @route   POST /api/users/register
// @desc    Register a new user. This is the new endpoint we are adding.
// @access  Public
router.post('/register', userController.registerUser);


// --- INTEGRATED & CORRECTED ---
// Your existing routes are kept, but their paths are corrected for standard use.
// Instead of '/users', we use '/' because '/api/users' is already defined in server.js.

// @route   GET /api/users
// @desc    Get all users (previously /users)
router.get('/', userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get a single user by ID (previously /users/:id)
router.get('/:id', userController.getUser);

module.exports = router;