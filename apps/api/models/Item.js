const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true, maxLength: 100},
    quantity: { type: Number, required: true, min: 0 },
    location: { type: String },
    description: { type: String }
}, {
    timestamps: true,
    strict: true
});

module.exports = mongoose.model('Item', itemSchema);
