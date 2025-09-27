import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaLeaf, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import ThemeToggle from '../ui/ThemeToggle';

const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const NavbarComponent = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useUserContext();
  const navigate = useNavigate();

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Testimonials", link: "#testimonials" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/customer/auth');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-background/95 backdrop-blur-sm border-b border-border' : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navbar */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection('#home')}
          >
            <FaLeaf className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">NourishNet</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.link)}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle variant="ghost" size="sm" />
            
            {loading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-accent rounded-lg px-3 py-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback><FaUser className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.cowboyLevel || 'Rookie'}
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleAuthAction} variant="secondary" size="sm">
                  Dashboard
                </Button>
                <Button onClick={handleLogout} variant="destructive" size="sm">
                  <FaSignOutAlt className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleAuthAction} variant="secondary">
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle variant="ghost" size="sm" />
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              size="sm"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background"
            >
              <div className="px-4 py-4 space-y-4">
                {/* Mobile Navigation */}
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.link)}
                    className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors font-medium"
                  >
                    {item.name}
                  </button>
                ))}

                <div className="pt-4 border-t border-border">
                  {loading ? (
                    <div className="flex justify-center py-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback><FaUser className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.displayName}</p>
                          <Badge variant="secondary" className="text-xs">
                            {user.cowboyLevel || 'Rookie'}
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={handleAuthAction} variant="secondary" className="w-full">
                        Dashboard
                      </Button>
                      <Button onClick={handleLogout} variant="destructive" className="w-full">
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleAuthAction} variant="secondary" className="w-full">
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default NavbarComponent;