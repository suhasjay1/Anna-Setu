const User = require('../models/User');
const Donation = require('../models/Donation');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const CompostSale = require('../models/CompostSale');
const Request = require('../models/Request');

// --- Get dashboard statistics ---
    exports.getDashboardStats = async (req, res) => {
    try {
        // Stats for the top cards
        const totalDonors = await User.countDocuments({ role: 'donor', status: 'approved' });
        const totalReceivers = await User.countDocuments({ role: 'receiver', status: 'approved' });
        const activeVolunteers = await User.countDocuments({ role: 'volunteer', status: 'approved' });
        
        const completedDonations = await Task.find({ status: 'Completed' }).populate('donation', 'quantity');
        const totalKilosDelivered = completedDonations.reduce((sum, task) => sum + (task.donation ? task.donation.quantity : 0), 0);
        const mealsServed = Math.floor(totalKilosDelivered * 2.5);

        // Stats for the "Pending Approvals" summary box
        const pendingVolunteers = await User.countDocuments({ status: 'pending', role: 'volunteer' });
        const pendingDonors = await User.countDocuments({ status: 'pending', role: 'donor' });
        const pendingReceivers = await User.countDocuments({ status: 'pending', role: 'receiver' });

        res.status(200).json({
            totalDonors,
            totalReceivers,
            activeVolunteers,
            mealsServed,
            pendingVolunteers,
            pendingDonors,
            pendingReceivers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching stats.', error: error.message });
    }
};


// --- Get recent platform activity ---
exports.getRecentActivity = async (req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 }).limit(10);
        res.status(200).json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// --- Get all open food requests from receivers ---
exports.getOpenRequests = async (req, res) => {
    try {
        const requests = await Request.find({ status: 'Open' })
            .populate('receiver', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching requests.', error: error.message });
    }
};

// --- Get all users awaiting approval ---
exports.getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' }).select('-password');
        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pending users.', error: error.message });
    }
};

// --- Get all users, optionally filtering by role or status ---
exports.getAllUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) { filter.role = req.query.role; }
        if (req.query.status) { filter.status = req.query.status; }
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching all users.', error: error.message });
    }
};

// --- Approve a specific user ---
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        user.status = 'approved';
        await user.save();
        const activity = new Activity({ text: `Admin approved the account for ${user.name}.`, type: 'user_approved', userRef: user._id });
        await activity.save();
        res.status(200).json({ message: `User ${user.name} has been approved.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error while approving user.', error: error.message });
    }
};

// --- Reject a specific user ---
exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        user.status = 'rejected';
        await user.save();
        const activity = new Activity({ text: `Admin rejected the account for ${user.name}.`, type: 'user_rejected' });
        await activity.save();
        res.status(200).json({ message: `User ${user.name} has been rejected.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error while rejecting user.', error: error.message });
    }
};

// --- Get all donations awaiting assignment ---
exports.getPendingDonations = async (req, res) => {
    try {
        const pendingDonations = await Donation.find({ status: 'Pending' }).populate('donor', 'name organizationName');
        res.status(200).json(pendingDonations);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching pending donations.', error: error.message });
    }
};

// --- Get a list of all tasks ---
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate({ path: 'donation', select: 'description quantity' })
            .populate({ path: 'volunteer', select: 'name' })
            .populate({ path: 'receiver', select: 'name' })
            .sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching tasks.', error: error.message });
    }
};
// --- Mark a food request as fulfilled ---
exports.fulfillRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        request.status = 'Fulfilled';
        await request.save();
        
        res.status(200).json({ message: 'Request has been marked as fulfilled.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fulfilling request.', error: error.message });
    }
};

// --- Assign a donation to a volunteer and receiver ---
exports.assignTask = async (req, res) => {
    const { donationId, volunteerId, receiverId } = req.body;
    try {
        const donation = await Donation.findById(donationId).populate('donor', 'name');
        if (!donation || donation.status !== 'Pending') {
            return res.status(404).json({ message: 'Donation not found or has already been assigned.' });
        }
        const newTask = new Task({ donation: donationId, volunteer: volunteerId, receiver: receiverId });
        await newTask.save();
        donation.status = 'Assigned';
        donation.assignedVolunteer = volunteerId;
        donation.currentTask = newTask._id;
        await donation.save();
        const activity = new Activity({ text: `A donation from ${donation.donor.name} was assigned.`, type: 'task_assigned' });
        await activity.save();
        res.status(201).json({ message: 'Task created and assigned successfully.', task: newTask });
    } catch (error) {
        res.status(500).json({ message: 'Server error during task assignment.', error: error.message });
    }
};

// --- Get all donations marked for compost ---
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

// --- Log a new compost sale ---
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

// --- Get history of all compost sales ---
exports.getSalesHistory = async (req, res) => {
    try {
        const sales = await CompostSale.find().sort({ saleDate: -1 });
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};