const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const hybridAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No authorization header or invalid format');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🔐 Attempting to verify token:', token.substring(0, 20) + '...');
  
  try {
    // First, try to verify as JWT token (for drivers and other custom tokens)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT Token verified for user:', decoded.userId, 'Role:', decoded.role);
      req.user = { 
        userId: decoded.userId,
        firebaseUid: decoded.firebaseUid, 
        role: decoded.role 
      };
      return next();
    } catch (jwtError) {
      console.log('🔄 JWT verification failed, trying Firebase token...');
      
      // If JWT fails, try Firebase token verification (for web clients)
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        console.log('✅ Firebase Token verified for user:', decoded.uid);
        req.user = { firebaseUid: decoded.uid };
        return next();
      } catch (firebaseError) {
        console.error('❌ Both JWT and Firebase token verification failed');
        console.error('JWT Error:', jwtError?.message);
        console.error('Firebase Error:', firebaseError?.message);
        return res.status(401).json({ 
          message: 'Invalid token', 
          error: 'Token verification failed for both JWT and Firebase'
        });
      }
    }
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

module.exports = hybridAuthMiddleware;