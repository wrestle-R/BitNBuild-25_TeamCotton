const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const authRoutesUnified = require('./routes/authRoutesUnified');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: 'http://localhost:5173',
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
app.use('/api/auth', authRoutesUnified); // Unified routes for dual user system

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NourishNet Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`NourishNet server running on port ${PORT}`);
});