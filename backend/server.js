const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const driverRoutes = require('./Routes/driverRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/vendor/upload', uploadRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/drivers', driverRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NourishNet Backend is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NourishNet server running on port ${PORT}`);
  console.log(`Available at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
});
