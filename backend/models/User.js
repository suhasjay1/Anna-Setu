const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'donor', 'volunteer', 'receiver'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'verified'], default: 'pending' },
    donorType: { type: String, enum: ['regular', 'instant'] },
    // UPDATED ADDRESS FIELD
    address: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    verificationDetails: {
        organizationName: String,
        contactPerson: String,
        licenseNumber: String,
        fullAddress: String
    }
}, { timestamps: true });

// --- Mongoose Middleware to Hash Password Before Saving ---
// This function runs automatically every time we save a new user
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// --- Mongoose Method to Compare Passwords ---
// This adds a custom function to our user documents to check passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
