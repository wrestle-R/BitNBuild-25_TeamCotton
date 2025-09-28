const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No authorization header or invalid format');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🔐 Attempting to verify token:', token.substring(0, 20) + '...');
  
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('✅ Token verified for user:', decoded.uid);
    req.user = { firebaseUid: decoded.uid, uid: decoded.uid };
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

module.exports = authMiddleware;