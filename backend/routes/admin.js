const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const { 
    getPendingUsers, 
    approveUser,
    rejectUser,
    getPendingDonations,
    assignTask,
    getAllUsers,
    getDashboardStats,
    getRecentActivity,
    getCompostDonations,
    logCompostSale,
    getSalesHistory,
    getOpenRequests,
    getAllTasks,
    fulfillRequest
} = require('../controllers/adminController');

// All routes in this file are protected and for admins only
router.use(authMiddleware, authorize('admin'));

// Dashboard Routes
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

// User Management Routes
router.get('/pending-users', getPendingUsers);
router.get('/users', getAllUsers);
router.post('/users/:id/approve', approveUser);
router.post('/users/:id/reject', rejectUser);

// Donation, Task, and Request Routes
router.get('/pending-donations', getPendingDonations);
router.post('/assign-task', assignTask);
router.get('/tasks', getAllTasks);
router.get('/requests', getOpenRequests);
router.post('/requests/:id/fulfill', fulfillRequest);

// Compost Management Routes
router.get('/compost/donations', getCompostDonations);
router.post('/compost/sales', logCompostSale);
router.get('/compost/sales', getSalesHistory);

module.exports = router;