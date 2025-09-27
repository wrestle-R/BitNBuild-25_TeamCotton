const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Firebase Admin SDK (you'll need to add your service account key)
try {
  // Initialize with your Firebase service account
  // admin.initializeApp({
  //   credential: admin.credential.cert(require('./firebase-service-account.json'))
  // });
  console.log('Firebase Admin initialized');
} catch (error) {
  console.log('Firebase Admin not configured:', error.message);
}

// Use routes
app.use('/api/auth', authRoutes); // Unified routes for dual user system
app.use('/api/admin', adminRoutes); // Admin routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NourishNet Backend is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NourishNet server running on port ${PORT}`);
  console.log(`Available at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.1.40:${PORT}`);
});