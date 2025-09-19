const Task = require('../models/Task');
const Donation = require('../models/Donation');
const User = require('../models/User');

exports.getVolunteerStats = async (req, res) => {
    try {
        const volunteerId = req.user.id;
        const tasksCompleted = await Task.countDocuments({ volunteer: volunteerId, status: 'Completed' });
        const activeTasks = await Task.countDocuments({ volunteer: volunteerId, status: { $in: ['Accepted', 'Picked Up'] } });
        
        const completedDonations = await Task.find({ volunteer: volunteerId, status: 'Completed' }).populate('donation', 'quantity');
        const totalKilosDelivered = completedDonations.reduce((sum, task) => sum + (task.donation ? task.donation.quantity : 0), 0);
        const mealsServed = Math.floor(totalKilosDelivered * 2.5);

        res.status(200).json({ tasksCompleted, activeTasks, mealsServed });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

exports.getAssignedTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ volunteer: req.user.id })
            .populate({
                path: 'donation',
                select: 'description quantity pickupAddress additionalGuidelines',
                populate: { path: 'donor', select: 'name phone' }
            })
            .populate('receiver', 'name address phone')
            .sort({ createdAt: -1 });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    const { status, qualityCheck } = req.body;
    const taskId = req.params.id;
    const volunteerId = req.user.id;
    try {
        const task = await Task.findOne({ _id: taskId, volunteer: volunteerId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found or you are not authorized to update it.' });
        }

        task.status = status;
        
        if (status === 'Picked Up' && qualityCheck) {
            task.qualityCheck = qualityCheck;
            await Donation.findByIdAndUpdate(task.donation, { status: 'Picked Up' });
        }
        
        if (status === 'Delivered') {
            await Donation.findByIdAndUpdate(task.donation, { status: 'Delivered' });
        }
        
        await task.save();
        res.status(200).json({ message: `Task status updated to ${status}.`, task });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating task status.', error: error.message });
    }
};