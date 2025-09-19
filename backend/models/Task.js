const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Pending Acceptance', 'Accepted', 'Picked Up', 'Delivered', 'Completed', 'Rejected'],
        default: 'Pending Acceptance',
    },
    // NEW FIELD TO STORE THE QUALITY CHECK REPORT
    qualityCheck: {
        foodQuality: { type: String, enum: ['Good', 'Average', 'Poor'] },
        packaging: { type: String, enum: ['Good', 'Average', 'Poor'] },
        remarks: { type: String }
    }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;