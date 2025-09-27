import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

// Detailed logging for debugging
console.log('🔧 Firebase Config Debug:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : '❌ MISSING',
  authDomain: firebaseConfig.authDomain || '❌ MISSING',
  projectId: firebaseConfig.projectId || '❌ MISSING',
  storageBucket: firebaseConfig.storageBucket || '❌ MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId || '❌ MISSING',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : '❌ MISSING'
});

let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  
  console.log('✅ Firebase initialized successfully for React Native');
  console.log('✅ Auth instance created:', !!auth);
} catch (error) {
  console.error('💥 Firebase initialization error:', error);
  console.error('💥 Error details:', error.message);
}

export { auth, googleProvider };
export default app;