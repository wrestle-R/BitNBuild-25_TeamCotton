import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUserContext } from '../context/UserContextSimplified'
import Landing from './pages/Landing'
import VendorAuth from './pages/Vendor/VendorAuth'
import VendorDashboard from './pages/Vendor/VendorDashboard'
import VendorProfile from './pages/Vendor/VendorProfile'
import VendorMenus from './pages/Vendor/VendorMenus'
import VendorPlans from './pages/Vendor/VendorPlans'
import CustomerAuth from './pages/Customer/CustomerAuth'
import CustomerDashboard from './pages/Customer/CustomerDashboard'
import CustomerProfile from './pages/Customer/CustomerProfile'
import CustomerMarketRoute from './pages/Customer/CustomerMarket'
import AdminAuth from './pages/Admin/AdminAuth'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ManageVendors from './pages/Admin/ManageVendors'
import { Toaster } from 'sonner' 

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

// Customer profile route  
const CustomerProfileRoute = () => {
  const { user, loading } = useUserContext();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading profile...</p>
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
  
  return <CustomerProfile />;
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/vendor/auth" element={<VendorAuth />} />
          <Route path="/customer/auth" element={<CustomerAuth />} />
          <Route path="/vendor/dashboard" element={<VendorRoute />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />
          <Route path="/vendor/menus" element={<VendorMenus />} />
          <Route path="/vendor/plans" element={<VendorPlans />} />
          <Route path="/customer/dashboard" element={<CustomerRoute />} />
          <Route path="/customer/market" element={<CustomerMarketRoute />} />
          <Route path="/customer/profile" element={<CustomerProfileRoute />} />
          {/* Hidden Admin Routes */}
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-vendors" element={<ManageVendors />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        theme="system"
        richColors
        style={{
          background: 'var(--primary)',
          color: 'var(--primary-foreground)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
        }}
      />
    </UserProvider>
  )
}

export default App
