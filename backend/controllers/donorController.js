const Donation = require('../models/Donation');
const User = require('../models/User'); // Keep for profile info if needed in future

// --- Create a New Donation ---
exports.createDonation = async (req, res) => {
    const { type, description, quantity, pickupAddress, additionalGuidelines } = req.body;
    const donorId = req.user.id;
    try {
        const newDonation = new Donation({
            donor: donorId,
            type,
            description,
            quantity,
            pickupAddress,
            additionalGuidelines
        });
        await newDonation.save();
        res.status(201).json({ message: 'Donation scheduled successfully!', donation: newDonation });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// --- Get a Donor's Donation History ---
exports.getDonationHistory = async (req, res) => {
    const donorId = req.user.id;
    try {
        const donations = await Donation.find({ donor: donorId })
            .populate('assignedVolunteer', 'name phone')
            .sort({ createdAt: -1 });
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};