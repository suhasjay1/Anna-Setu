const mongoose = require('mongoose');

const CompostSaleSchema = new mongoose.Schema({
    buyerName: {
        type: String,
        required: true,
        trim: true,
    },
    quantitySold: { // in kilograms
        type: Number,
        required: true,
    },
    revenue: { // in your local currency
        type: Number,
        required: true,
    },
    saleDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

const CompostSale = mongoose.model('CompostSale', CompostSaleSchema);

module.exports = CompostSale;