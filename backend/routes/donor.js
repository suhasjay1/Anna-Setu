const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createDonation, getDonationHistory } = require('../controllers/donorController');

// --- Define Donor-Specific Routes ---

// @route   POST /api/donor
// @desc    Create a new donation
// @access  Private (only logged-in users can access)
router.post('/', authMiddleware, createDonation);

// @route   GET /api/donor
// @desc    Get the logged-in donor's history
// @access  Private
router.get('/', authMiddleware, getDonationHistory);

module.exports = router;