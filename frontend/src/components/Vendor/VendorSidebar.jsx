import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaUsers, FaDollarSign, FaChartBar, FaUser, FaTachometerAlt, FaCog, FaSignOutAlt, FaBoxes } from 'react-icons/fa';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import ThemeToggle from '../ui/ThemeToggle';

const VendorSidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useUserContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Error handled in context
    }
  };

  const menuItems = [
    { icon: FaTachometerAlt, label: 'Dashboard', active: true },
    { icon: FaStore, label: 'My Store' },
    { icon: FaBoxes, label: 'Inventory' },
    { icon: FaUsers, label: 'Customers' },
    { icon: FaDollarSign, label: 'Sales' },
    { icon: FaChartBar, label: 'Analytics' },
    { icon: FaCog, label: 'Settings' },
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
            <FaStore className="w-8 h-8 text-blue-500 flex-shrink-0" />
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <h1 className="font-montserrat font-bold text-sidebar-foreground text-lg">
                  Vendor
                </h1>
                <p className="text-sidebar-foreground/70 text-sm">Hub</p>
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
                {item.active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                )}
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 transition-all duration-200 ${
                    isOpen ? 'px-3' : 'px-0 justify-center'
                  } ${
                    item.active 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200 shadow-sm ml-2' 
                      : 'text-sidebar-foreground hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-blue-500' : ''}`} />
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`font-inter ${item.active ? 'font-semibold' : ''}`}
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
          {/* User Profile */}
          {user && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>
                    <FaUser className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden flex-1 min-w-0"
                  >
                    <p className="text-sidebar-foreground font-medium truncate">
                      {user.displayName}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700">
                      {user.vendorTier || 'Basic'}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          )}
          
          {/* Theme Toggle */}
          <div className="p-4 border-b border-sidebar-border">
            {isOpen ? (
              <ThemeToggle 
                variant="ghost"
                size="default"
                showLabel={true}
                className="w-full justify-start text-sidebar-foreground hover:text-blue-700 hover:bg-blue-50"
              />
            ) : (
              <div className="flex justify-center">
                <ThemeToggle 
                  variant="ghost"
                  size="sm"
                  className="text-sidebar-foreground hover:text-blue-700 hover:bg-blue-50"
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
          className="absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full w-6 h-6 p-0 hover:bg-blue-50"
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

export default VendorSidebar;