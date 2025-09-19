const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['human', 'animal', 'compost'], required: true },
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    pickupAddress: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'Picked Up', 'Delivered', 'Completed'], // Added more statuses
        default: 'Pending',
    },
    additionalGuidelines: { type: String, trim: true },
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // NEW FIELD
    currentTask: { // To easily link this donation to its active task
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }
}, { timestamps: true });

const Donation = mongoose.model('Donation', DonationSchema);
module.exports = Donation;