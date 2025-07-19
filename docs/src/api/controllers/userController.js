// docs/src/api/controllers/userController.js

const UserModel = require('../models/userModel');

// Get all users
exports.getUsers = (req, res) => {
    try {
        const users = UserModel.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
};

// Get a single user by ID
exports.getUser = (req, res) => {
    try {
        const user = UserModel.getUserById(req.params.id);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error });
    }
};