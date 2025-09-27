import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { UserProvider, useUserContext } from '../context/UserContextSimplified'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import { VendorDashboard, VendorAuth } from './pages/Vendor'
import { CustomerDashboard, CustomerAuth } from './pages/Customer'
import AdminAuth from './pages/Admin/AdminAuth'
import AdminDashboard from './pages/Admin/AdminDashboard'

// Route wrapper for authentication page
const AuthRoute = () => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Auth />;
};

// Route wrapper for landing page (only accessible when not logged in)
const LandingRoute = () => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    if (user.role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Landing />;
};

// General protected route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Vendor dashboard route
const VendorRoute = () => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/vendor/auth" replace />;
  }
  
  if (user.role !== 'vendor') {
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    return <Navigate to="/vendor/auth" replace />;
  }
  
  return <VendorDashboard />;
};

// Customer dashboard route  
const CustomerRoute = () => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading customer dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/customer/auth" replace />;
  }
  
  if (user.role !== 'customer') {
    if (user.role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    return <Navigate to="/customer/auth" replace />;
  }
  
  return <CustomerDashboard />;
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/vendor/auth" element={<VendorAuth />} />
          <Route path="/customer/auth" element={<CustomerAuth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vendor/dashboard" element={<VendorRoute />} />
          <Route path="/customer/dashboard" element={<CustomerRoute />} />
          {/* Hidden Admin Routes */}
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: 'var(--primary-foreground)',
              secondary: 'var(--primary)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--destructive)',
              secondary: 'var(--primary-foreground)',
            },
          },
        }}
      />
    </UserProvider>
  )
}

export default App
