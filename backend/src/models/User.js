// backend/src/models/User.js - FINAL, PRODUCTION-READY

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
    stripeCustomerId: { type: String, required: true, unique: true },
    tier: { type: String, enum: ['free', 'basic', 'custom', 'a gang of ai managers'], default: 'free' },
    status: { type: String, enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'none'], default: 'none' },
    subscriptionId: { type: String, default: null },
    currentPeriodEnds: { type: Date, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema({
    email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true, match: [/\S+@\S+\.\S+/, 'is invalid'] },
    password: { type: String, required: [true, 'Password is required.'], minlength: [8, 'Password must be at least 8 characters long.'] },
    subscription: { type: subscriptionSchema, required: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);