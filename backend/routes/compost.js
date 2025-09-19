const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');
const {
    getCompostDonations,
    logCompostSale,
    getSalesHistory
} = require('../controllers/compostController');

router.use(authMiddleware, authorize('admin'));

router.get('/donations', getCompostDonations);
router.post('/sales', logCompostSale);
router.get('/sales', getSalesHistory);

module.exports = router;