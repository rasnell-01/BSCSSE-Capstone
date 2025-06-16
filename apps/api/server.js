const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

// Routes
app.use('/api/items', require('./router'));

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
