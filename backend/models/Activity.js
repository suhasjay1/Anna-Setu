const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['user_registered', 'donation_created', 'task_assigned', 'user_approved', 'user_rejected'],
        required: true,
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = Activity;