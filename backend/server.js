const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT ;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8082', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Use routes
app.use('/api/auth', authRoutes); // Unified routes for dual user system
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/vendor', vendorRoutes); // Vendor routes
app.use('/api/vendor/upload', uploadRoutes); // Upload routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NourishNet Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`NourishNet server running on port ${PORT}`);
});