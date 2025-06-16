# Inventory App Design Document - Part 6: MongoDB Schema

## 6. MongoDB Schema (Mongoose)

### Overview
This section defines the MongoDB schema for the `Item` model using Mongoose, including field definitions, validation rules, indexing, and timestamps.

### Schema Definition
```javascript
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  location: { type: String, trim: true },
  description: { type: String, trim: true },
  sku: { type: String, unique: true, sparse: true },
  category: { type: String, trim: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

itemSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
```

### Details
- **Validation**: Ensures `name` and `quantity` are required, with `quantity` >= 0.
- **Indexing**: Text indexes on `name` and `location` enable efficient search queries.
- **Sparse Index**: Allows `sku` to be unique but optional (for barcode/QR code support).
- **Timestamps**: Automatically adds `createdAt` and `updatedAt` fields.

### Notes
- The schema aligns with the `Item` model defined in **Part 3: Data Model**.
- Future enhancements (e.g., internationalization) may extend this schema (see **Enhancement Suggestions**, Part 10, Section 10.7).