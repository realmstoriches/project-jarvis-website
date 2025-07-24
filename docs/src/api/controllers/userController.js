// docs/src/api/controllers/userController.js

const User = require('../models/userModel'); // Adjust path if necessary
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Make sure STRIPE_SECRET_KEY is in your .env

/**
 * @desc    Register a new user, create a Stripe customer, and save to DB
 * @route   POST /api/users/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // 1. Check if user already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 2. Create a new customer in Stripe
        const customer = await stripe.customers.create({
            email: email,
            description: `Customer for ${email}`,
        });

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create a new user with hashed password and Stripe ID
        const newUser = new User({
            email,
            password: hashedPassword,
            subscription: {
                stripeCustomerId: customer.id, // Store the new Stripe customer ID
            }
        });

        // 5. Save the new user to MongoDB
        await newUser.save();

        // Send a success response without sensitive data
        res.status(201).json({
            message: 'User registered successfully. Please log in.',
            userId: newUser._id,
            stripeCustomerId: customer.id
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'An error occurred during registration.' });
    }
};

/**
 * @desc    Get all users (for admin purposes later)
 * @route   GET /api/users
 * @access  Private (will be protected later)
 */
exports.getUsers = async (req, res) => {
    try {
        // Find all users but exclude their password from the result
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users', error });
    }
};

/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Private (will be protected later)
 */
exports.getUser = async (req, res) => {
    try {
        // Find a user by their MongoDB _id and exclude their password
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user', error });
    }
};