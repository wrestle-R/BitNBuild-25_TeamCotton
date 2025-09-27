// This is a simple test to verify that the backend integration works

import { loginUser, registerUser, logoutUser, getCurrentUser } from './api/authApi';

/**
 * Tests the authentication flow
 * Run this in your app with:
 * 
 * import { testAuth } from './testAuth';
 * testAuth();
 */
export const testAuth = async () => {
  console.log('===== Testing Auth Flow =====');
  
  try {
    // Test getting current user (should be null if not logged in)
    console.log('1. Checking if user is already logged in...');
    const currentUser = await getCurrentUser();
    if (currentUser) {
      console.log('Current user found:', currentUser);
      console.log('Logging out first...');
      await logoutUser();
      console.log('Logged out successfully');
    } else {
      console.log('No current user found, proceeding with tests');
    }

    // Test variables
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const testName = 'Test User';

    // Test registration (this will fail if user already exists)
    try {
      console.log(`2. Testing registration for ${testEmail}...`);
      const registerResult = await registerUser({
        name: testName,
        email: testEmail,
        password: testPassword
      });
      console.log('Registration successful:', registerResult.user);
    } catch (regError) {
      console.warn('Registration failed (user may already exist):', regError.message);
    }

    // Test login
    console.log(`3. Testing login for ${testEmail}...`);
    const loginResult = await loginUser(testEmail, testPassword);
    console.log('Login successful:', loginResult.user);
    
    // Get current user after login
    console.log('4. Getting current user after login...');
    const loggedInUser = await getCurrentUser();
    console.log('Current user:', loggedInUser);
    
    // Test logout
    console.log('5. Testing logout...');
    await logoutUser();
    console.log('Logout successful');
    
    // Verify logout worked
    console.log('6. Verifying logout worked...');
    const afterLogoutUser = await getCurrentUser();
    if (!afterLogoutUser) {
      console.log('Logout verification successful: no current user found');
    } else {
      console.warn('Logout may have failed, user still found:', afterLogoutUser);
    }
    
    console.log('===== Auth Tests Complete =====');
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};