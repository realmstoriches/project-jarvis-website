const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This sub-document will be embedded in the User model.
// It keeps subscription details organized.
const subscriptionSchema = new Schema({
    tier: {
        type: String,
        enum: ['free', 'basic', 'custom', 'premium'], // Defines the possible tiers
        default: 'free'
    },
    stripeCustomerId: { // The customer ID from Stripe, e.g., 'cus_xxxxxxxx'
        type: String,
        default: null
    },
    stripeSubscriptionId: { // The subscription ID from Stripe, e.g., 'sub_xxxxxxxx'
        type: String,
        default: null
    },
    subscriptionStatus: { // The status from Stripe, e.g., 'active', 'canceled'
        type: String,
        default: 'none'
    },
    endDate: { // The date the current billing period ends
        type: Date,
        default: null
    }
}, { _id: false }); // _id: false prevents Mongoose from creating a separate ID for this sub-document

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // We embed the subscription schema here.
    // Every user will have a subscription object, defaulting to 'free'.
    subscription: {
        type: subscriptionSchema,
        default: () => ({}) 
    }
});

// Create and export the model, which allows our app to interact with the 'User' collection in MongoDB
module.exports = mongoose.model('User', userSchema);