import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useUserContext } from '../../context/UserContextSimplified';
import { FaStore, FaGoogle, FaCheck, FaEye, FaEyeSlash, FaHome, FaShoppingBasket } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import toast from 'react-hot-toast';

const Auth = () => {
  const { 
    user, 
    userType: contextUserType,
    loading: contextLoading, 
    error: contextError,
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle,
    switchUserType,
    testConnection: contextTestConnection
  } = useUserContext();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  console.log('🎯 Auth component - Current userType:', contextUserType);

  // Use the user type from context or default
  const userType = contextUserType;

  useEffect(() => {
    // Redirect if already authenticated to correct dashboard
    if (user && !contextLoading) {
      console.log('🔄 Auth - User authenticated, redirecting to dashboard for userType:', userType);
      
      if (userType === 'vendor') {
        navigate('/user1/dashboard', { replace: true });
      } else if (userType === 'customer') {
        navigate('/user2/dashboard', { replace: true });
      } else {
        // Fallback to general dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, contextLoading, userType, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        // Sign up validation
        if (!formData.displayName.trim()) {
          toast.error(`Please enter your ${userType} name`);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }

        // Use context register function
        await registerWithEmail(formData.email, formData.password, formData.displayName);
        
      } else {
        // Use context login function
        await loginWithEmail(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Error handling is done by the context
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Use context Google login function
      await loginWithGoogle();
    } catch (error) {
      console.error('Google auth error:', error);
      // Error handling is done by the context
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    });
  };

  const handleUserTypeChange = (newType) => {
    console.log('🔄 Changing user type from', userType, 'to', newType);
    switchUserType(newType);
    toast.success(`Switched to ${newType} mode! ${newType === 'vendor' ? '🏪' : '🛒'}`);
  };

  // Use context loading and error states
  const loading = contextLoading;
  const error = contextError;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Back to Home Button */}
          <div className="flex justify-between items-center mb-4 -ml-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground font-inter"
            >
              <FaHome className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <Button
              onClick={async () => {
                const result = await contextTestConnection();
                if (result.success) {
                  toast.success('✅ Backend connected: ' + result.message);
                } else {
                  toast.error('❌ Backend connection failed: ' + result.message);
                }
              }}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground font-inter"
            >
              Test Backend
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground font-montserrat mb-2 flex items-center justify-center gap-3">
            {userType === 'vendor' ? (
              <FaStore className="w-12 h-12 text-primary" />
            ) : (
              <FaShoppingBasket className="w-12 h-12 text-primary" />
            )}
            NourishNet
          </h1>
          <p className="text-muted-foreground font-inter text-lg">
            {userType === 'vendor' 
              ? 'Digitize your tiffin service!'
              : 'Fresh meals, delivered daily!'
            }
          </p>
        </motion.div>

        {/* User Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6"
        >
          <Tabs value={userType} onValueChange={handleUserTypeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vendor" className="flex items-center">
                <FaStore className="mr-2 h-4 w-4" />
                Vendor
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center">
                <FaShoppingBasket className="mr-2 h-4 w-4" />
                Customer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground font-montserrat">
                {isSignUp 
                  ? `Join NourishNet as a ${userType === 'vendor' ? 'Vendor' : 'Customer'}`
                  : `Welcome Back ${userType === 'vendor' ? 'Vendor' : 'Customer'}!`
                }
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                {isSignUp 
                  ? `Create your ${userType} account`
                  : `Sign in to your ${userType === 'vendor' ? 'vendor dashboard' : 'customer account'}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-foreground font-inter font-medium">
                      {userType === 'vendor' ? 'Business Name' : 'Full Name'}
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder={`Enter your ${userType === 'vendor' ? 'business' : 'full'} name`}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-inter font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-inter font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FaEye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground font-inter font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FaEye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-semibold shadow-lg"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="mr-2 h-4 w-4 animate-spin border-2 border-primary-foreground border-t-transparent rounded-full inline-block" />
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {userType === 'vendor' ? (
                        <FaStore className="w-5 h-5" />
                      ) : (
                        <FaShoppingBasket className="w-5 h-5" />
                      )}
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Toggle Sign In/Sign Up */}
              <div className="text-center mb-6">
                <Button
                  variant="link"
                  onClick={toggleMode}
                  className="text-muted-foreground hover:text-foreground font-inter font-medium p-0"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in here' 
                    : "Don't have an account? Sign up here"
                  }
                </Button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-2 bg-card text-muted-foreground font-inter text-sm">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                onClick={handleGoogleAuth}
                disabled={loading}
                variant="outline"
                className="w-full font-inter font-semibold shadow-lg"
                size="lg"
              >
                <FaGoogle className="w-5 h-5 mr-3" />
                Continue with Google
              </Button>

              {/* Features */}
              <div className="mt-6 space-y-3 text-sm text-muted-foreground font-inter">
                {userType === 'vendor' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>Manage subscribers and menu items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>AI-powered route optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>Sales analytics and insights</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>Subscribe to local tiffin services</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>Real-time delivery tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-primary w-4 h-4" />
                      <span>Flexible meal preferences</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 text-muted-foreground font-inter text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <p>Secure authentication powered by Firebase</p>
          <p className="mt-1">Your data is protected and encrypted</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;