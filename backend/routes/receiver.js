const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const {
    createRequest,
    getMyRequests,
    getUpcomingDeliveries,
    confirmReceipt,
    getDeliveryHistory
} = require('../controllers/receiverController');

// All routes here are for logged-in receivers only
router.use(authMiddleware, authorize('receiver'));

// Routes for managing food requests
router.post('/requests', createRequest);
router.get('/requests', getMyRequests);

// Routes for tracking deliveries
router.get('/deliveries/upcoming', getUpcomingDeliveries);

// Route for confirming a delivery is received
router.post('/tasks/:id/confirm', confirmReceipt);
router.get('/deliveries/history', getDeliveryHistory);

module.exports = router;