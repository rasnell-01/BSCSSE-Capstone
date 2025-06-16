const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const Item = require('./models/Item');

// Validation middleware
const validateItem = [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),
    body('location').optional().isString().trim().escape(),
    body('description').optional().isString().trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array()
            });
        }
        next();
    },
];

// GET all items
router.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create item
router.post('/', validateItem, async (req, res) => {
    const { name, quantity, description } = req.body;
    const item = new Item({ name, quantity, description });
    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update item
router.put('/:id', validateItem, async (req, res) => {
    try {
        const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updated) return res.status(404).json({ message: 'Item not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Item.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
