const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');

exports.registerUser = async (req, res) => {
    const { name, email, password, role, donorType } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        const newUser = new User({ name, email, password, role, donorType });
        if (role === 'donor' && donorType === 'instant') {
            newUser.status = 'approved';
        }
        await newUser.save();
        const activity = new Activity({
            text: `${newUser.name} registered as a new ${newUser.role}.`,
            type: 'user_registered',
            userRef: newUser._id
        });
        await activity.save();
        res.status(201).json({ message: 'User registered successfully! Please log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        if (user.status !== 'approved') {
            return res.status(403).json({ message: 'Your account is pending approval. Please wait.' });
        }
        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                donorType: user.donorType
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};