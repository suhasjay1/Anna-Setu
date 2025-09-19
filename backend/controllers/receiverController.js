const Request = require('../models/Request');
const Task = require('../models/Task');
const Donation = require('../models/Donation');

// --- Create a new food request ---
exports.createRequest = async (req, res) => {
    const { details } = req.body;
    const receiverId = req.user.id;
    try {
        const newRequest = new Request({ receiver: receiverId, details });
        await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully.', request: newRequest });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// --- Get all requests made by the logged-in receiver ---
exports.getMyRequests = async (req, res) => {
    const receiverId = req.user.id;
    try {
        const requests = await Request.find({ receiver: receiverId }).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// --- Get all upcoming deliveries assigned to the receiver ---
exports.getUpcomingDeliveries = async (req, res) => {
    const receiverId = req.user.id;
    try {
        const tasks = await Task.find({ 
            receiver: receiverId,
            status: { $in: ['Accepted', 'In-Transit', 'Delivered'] }
        })
        .populate({
            path: 'donation',
            select: 'description quantity',
            populate: { path: 'donor', select: 'name' }
        })
        .populate('volunteer', 'name phone')
        .sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// --- Confirm receipt of a delivery ---
exports.confirmReceipt = async (req, res) => {
    const taskId = req.params.id;
    const receiverId = req.user.id;
    try {
        const task = await Task.findOne({ _id: taskId, receiver: receiverId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found or you are not authorized.' });
        }
        
        // Update statuses
        task.status = 'Completed';
        await task.save();
        await Donation.findByIdAndUpdate(task.donation, { status: 'Completed' });

        res.status(200).json({ message: 'Receipt confirmed. Thank you!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};
// --- THIS IS THE NEW FUNCTION ---
// --- Get history of all completed deliveries for the receiver ---
exports.getDeliveryHistory = async (req, res) => {
    const receiverId = req.user.id;
    try {
        const tasks = await Task.find({ 
            receiver: receiverId,
            status: 'Completed' 
        })
        .populate({
            path: 'donation',
            select: 'description quantity',
            populate: { path: 'donor', select: 'name' }
        })
        .sort({ updatedAt: -1 }); // Sort by completion date
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};
