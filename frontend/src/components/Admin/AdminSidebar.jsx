import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { 
  FaLock, 
  FaStore, 
  FaSignOutAlt,
  FaUser,
  FaTachometerAlt
} from 'react-icons/fa';
import { Button } from '../ui/button';
import ThemeToggle from '../ui/ThemeToggle';
import { toast } from 'sonner';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_login');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleMenuClick = (route) => {
    navigate(route);
  };

  const menuItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard', route: '/admin/dashboard' },
    { id: 'manage-vendors', icon: FaStore, label: 'Manage Vendors', route: '/admin/manage-vendors' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-16'
        }`}
        initial={false}
        animate={{ x: 0 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <FaLock className="w-6 h-6 text-primary flex-shrink-0" />
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h1 className="font-montserrat font-bold text-sidebar-foreground text-lg">
                  Admin Panel
                </h1>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.route;
              return (
                <li key={index} className="relative">
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => handleMenuClick(item.route)}
                    className={`w-full justify-start gap-3 transition-all duration-200 ${
                      isOpen ? 'px-3' : 'px-0 justify-center'
                    } ${
isActive
  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm ml-2 hover:bg-primary/20 hover:text-primary'
  : 'text-sidebar-foreground hover:text-primary hover:bg-primary/5'

                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`font-inter ${isActive ? 'font-semibold' : ''}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border">
          {/* Admin Profile */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="w-4 h-4 text-primary" />
              </div>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden flex-1 min-w-0"
                >
                  <p className="text-sidebar-foreground font-medium truncate">
                    Admin
                  </p>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className="p-4 border-b border-sidebar-border">
            {isOpen ? (
              <ThemeToggle 
                variant="ghost"
                size="default"
                showLabel={true}
                className="w-full justify-start text-sidebar-foreground hover:text-primary hover:bg-primary/5"
              />
            ) : (
              <div className="flex justify-center">
                <ThemeToggle 
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground hover:text-primary hover:bg-primary/5"
                />
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-4">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className={`w-full justify-start gap-3 ${
                isOpen ? 'px-3' : 'px-0 justify-center'
              } text-sidebar-foreground hover:text-destructive`}
            >
              <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-inter"
                >
                  Logout
                </motion.span>
              )}
            </Button>
          </div>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          size="sm"
          className="absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full w-6 h-6 p-0 hover:bg-primary/5"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.div>
        </Button>
      </motion.div>
    </>
  );
};

export default AdminSidebar;