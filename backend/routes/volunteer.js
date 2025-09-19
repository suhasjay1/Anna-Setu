const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { 
    getAssignedTasks, 
    updateTaskStatus,
    getVolunteerStats // Import the new function
} = require('../controllers/volunteerController');

// All routes in this file are for logged-in volunteers only
router.use(authMiddleware, authorize('volunteer'));

// @route   GET /api/volunteer/stats
// @desc    Get statistics for the volunteer's dashboard
router.get('/stats', getVolunteerStats);

// @route   GET /api/volunteer/tasks
// @desc    Get all tasks assigned to the volunteer
router.get('/tasks', getAssignedTasks);

// @route   PATCH /api/volunteer/tasks/:id/status
// @desc    Update the status of a specific task
router.patch('/tasks/:id/status', updateTaskStatus);

module.exports = router;