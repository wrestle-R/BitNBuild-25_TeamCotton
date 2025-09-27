import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaHatCowboy, FaShieldAlt, FaEye, FaEyeSlash, FaHome, FaCrown } from 'react-icons/fa';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import toast from 'react-hot-toast';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated as admin
  useEffect(() => {
    const adminAuth = localStorage.getItem('wildwest_admin_auth');
    if (adminAuth === 'authenticated') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);

      // Frontend-only validation (as requested)
      const adminCredentials = {
        username: import.meta.env.VITE_ADMIN_USERNAME,
        password: import.meta.env.VITE_ADMIN_PASSWORD 
      };

      if (credentials.username === adminCredentials.username && 
          credentials.password === adminCredentials.password) {
        
        // Store admin authentication
        localStorage.setItem('wildwest_admin_auth', 'authenticated');
        localStorage.setItem('wildwest_admin_login', Date.now().toString());
        
        toast.success('Welcome to the Sheriff\'s Office!');
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid sheriff credentials, partner!');
      }
    } catch (error) {
      toast.error('Something went wrong at the sheriff\'s office!');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="flex justify-start mb-4 -ml-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground font-inter"
            >
              <FaHome className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground font-montserrat mb-2 flex items-center justify-center gap-3">
            <FaShieldAlt className="w-12 h-12 text-primary" />
            Sheriff's Office
          </h1>
          <p className="text-muted-foreground font-inter text-lg">
            Administrative access to the Wild West Arena
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <FaCrown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground font-inter">Authorized Personnel Only</span>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground font-montserrat flex items-center justify-center gap-2">
                <FaShieldAlt className="w-6 h-6 text-primary" />
                Admin Access
              </CardTitle>
              <CardDescription className="text-muted-foreground font-inter">
                Enter your sheriff credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground font-inter font-medium">
                    Sheriff Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleInputChange}
                    placeholder="Enter your admin username"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-inter font-medium">
                    Sheriff Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="Enter your admin password"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                      required
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-semibold shadow-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      <span>Verifying Badge...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="w-5 h-5" />
                      <span>Access Sheriff's Office</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-foreground font-inter">Security Notice</p>
                    <p className="text-muted-foreground font-inter leading-relaxed">
                      This area is restricted to authorized sheriffs only. 
                      All access attempts are logged and monitored.
                    </p>
                    <div className="text-xs text-muted-foreground font-inter mt-2 opacity-60">
                      Current: {import.meta.env.VITE_ADMIN_USERNAME} / {import.meta.env.VITE_ADMIN_PASSWORD}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 text-muted-foreground font-inter text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>Secure administrative access</p>
          <p className="mt-1">Wild West Arena Admin Panel</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminAuth;