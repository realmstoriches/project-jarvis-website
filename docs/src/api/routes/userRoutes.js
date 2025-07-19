// docs/src/api/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define the routes
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUser);

module.exports = router;