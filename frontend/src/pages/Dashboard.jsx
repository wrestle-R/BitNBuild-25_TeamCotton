import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../context/UserContextSimplified';
import { FaStore, FaShoppingBasket } from 'react-icons/fa';

const Dashboard = () => {
  const { user, userType, loading } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect users to their specific dashboard based on role
      if (userType === 'vendor' || user.role === 'vendor') {
        navigate('/user1/dashboard', { replace: true });
      } else if (userType === 'customer' || user.role === 'customer') {
        navigate('/user2/dashboard', { replace: true });
      }
    }
  }, [user, userType, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">
            Loading your NourishNet dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Welcome to NourishNet!</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <FaStore className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">🍽️</span>
            <FaShoppingBasket className="w-8 h-8 text-primary" />
          </div>
          <a href="/auth" className="text-primary hover:underline">Go to Sign In</a>
        </div>
      </div>
    );
  }

  // Fallback content while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-foreground font-inter text-lg">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default Dashboard;