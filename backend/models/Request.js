const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    details: {
        type: String,
        required: true,
        trim: true,
    },
    // THIS FIELD IS UPDATED
    status: {
        type: String,
        enum: ['Open', 'Fulfilled'],
        default: 'Open',
    },
}, {
    timestamps: true
});

const Request = mongoose.model('Request', RequestSchema);

module.exports = Request;