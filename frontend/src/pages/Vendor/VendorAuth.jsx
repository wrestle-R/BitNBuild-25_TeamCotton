import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaGoogle, FaCheck, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const VendorAuth = () => {
  const { 
    user, 
    loading: contextLoading, 
    error: contextError,
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle,
    switchUserType
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

  useEffect(() => {
    switchUserType('vendor');
  }, [switchUserType]);

  useEffect(() => {
    if (user && !contextLoading) {
      navigate('/user1/dashboard', { replace: true });
    }
  }, [user, contextLoading, navigate]);

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
        if (!formData.displayName.trim()) {
          toast.error('Please enter your business name');
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
        await registerWithEmail(formData.email, formData.password, formData.displayName);
        navigate('/user1/dashboard', { replace: true });
      } else {
        await loginWithEmail(formData.email, formData.password);
        navigate('/user1/dashboard', { replace: true });
      }
    } catch (error) {
      // Error handled by context
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      navigate('/user1/dashboard', { replace: true });
    } catch (error) {
      // Error handled by context
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
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <FaStore className="w-10 h-10 text-primary" />
              <span className="text-3xl md:text-4xl font-bold text-foreground font-montserrat">NourishNet</span>
              <Badge variant="secondary" className="ml-2 text-xs">Vendor</Badge>
            </div>
            <p className="text-muted-foreground font-inter text-lg">
              Digitize your tiffin service!
            </p>
          </div>
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
                  ? 'Join NourishNet as a Vendor'
                  : 'Welcome Back Vendor!'
                }
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                {isSignUp 
                  ? 'Create your vendor account'
                  : 'Sign in to your vendor dashboard'
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
                      Business Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Enter your business name"
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
                      <FaStore className="w-5 h-5" />
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VendorAuth;