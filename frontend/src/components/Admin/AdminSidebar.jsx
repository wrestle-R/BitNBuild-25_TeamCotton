import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { 
  FaShieldAlt, 
  FaUsers, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt, 
  FaTachometerAlt,
  FaCrown
} from 'react-icons/fa';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import ThemeToggle from '../ui/ThemeToggle';
import toast from 'react-hot-toast';

const AdminSidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  // Debug logging
  console.log('🎯 AdminSidebar Props:', { isOpen, setIsOpen: !!setIsOpen, activeTab });
  console.log('🎯 AdminSidebar User:', user);

  const handleLogout = () => {
    localStorage.removeItem('wildwest_admin_auth');
    localStorage.removeItem('wildwest_admin_login');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', icon: FaTachometerAlt, label: 'Overview' },
    { id: 'users', icon: FaUsers, label: 'Manage Cowboys' },
    { id: 'analytics', icon: FaChartBar, label: 'Analytics' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
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
            <FaShieldAlt className="w-8 h-8 text-primary flex-shrink-0" />
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h1 className="font-montserrat font-bold text-sidebar-foreground text-lg">
                  Sheriff's Office
                </h1>
                <p className="text-sidebar-foreground/70 text-sm">Admin Panel</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index} className="relative">
                {/* Active indicator */}
                {activeTab === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full justify-start gap-3 transition-all duration-200 ${
                    isOpen ? 'px-3' : 'px-0 justify-center'
                  } ${
                    activeTab === item.id 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm ml-2' 
                      : 'text-sidebar-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-primary' : ''}`} />
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`font-inter ${activeTab === item.id ? 'font-semibold' : ''}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border">
          {/* Admin Profile */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center relative overflow-hidden flex-shrink-0"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <FaCrown className="w-5 h-5 text-accent-foreground relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-accent/10 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
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
                  <Badge variant="secondary" className="text-xs mt-1 bg-accent/10 text-accent-foreground border-accent/20">
                    Sheriff
                  </Badge>
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