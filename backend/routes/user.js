const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMyProfile, updateMyProfile } = require('../controllers/userController');

// All routes here are protected and require a user to be logged in
router.use(authMiddleware);

// @route   GET /api/users/me
// @desc    Get current user's profile
router.get('/me', getMyProfile);

// @route   PUT /api/users/me
// @desc    Update current user's profile
router.put('/me', updateMyProfile);

module.exports = router;