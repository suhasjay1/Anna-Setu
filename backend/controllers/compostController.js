const CompostSale = require('../models/CompostSale');
const Donation = require('../models/Donation');

exports.getCompostDonations = async (req, res) => {
    try {
        const compostDonations = await Donation.find({ type: 'compost' })
            .populate('donor', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(compostDonations);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

exports.logCompostSale = async (req, res) => {
    const { buyerName, quantitySold, revenue } = req.body;
    try {
        const newSale = new CompostSale({ buyerName, quantitySold, revenue });
        await newSale.save();
        res.status(201).json({ message: 'Compost sale logged successfully.', sale: newSale });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

exports.getSalesHistory = async (req, res) => {
    try {
        const sales = await CompostSale.find().sort({ saleDate: -1 });
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};