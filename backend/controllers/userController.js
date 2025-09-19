const User = require('../models/User');

// --- Get the logged-in user's own profile ---
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- Update the logged-in user's own profile ---
exports.updateMyProfile = async (req, res) => {
    const { name, phone, address } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.phone = phone || user.phone;
        if (address) {
            user.address.street = address.street || user.address.street;
            user.address.city = address.city || user.address.city;
            user.address.state = address.state || user.address.state;
            user.address.zip = address.zip || user.address.zip;
        }

        const updatedUser = await user.save();
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};