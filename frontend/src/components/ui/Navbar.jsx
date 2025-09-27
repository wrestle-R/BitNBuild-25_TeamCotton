import React, { useState, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaHatCowboy, FaBars, FaTimes, FaUser, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Separator } from './separator';
import { Sheet, SheetContent, SheetTrigger } from './sheet';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

// Simple utility function for classNames
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const NavbarComponent = () => {
  const ref = useRef(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useUserContext();
  const navigate = useNavigate();
  
  const navItems = [
    { name: "Home", link: "#home" },
    { name: "About", link: "#about" },
    { name: "Arena", link: "#arena" },
    { name: "Contact", link: "#contact" }
  ];

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const scrollToSection = (sectionId) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (user) {
      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      // Navigate to general auth page (which will have user type selection)
      navigate('/customer/auth');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home after logout
      navigate('/');
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <motion.div
      ref={ref}
      className="fixed inset-x-0 top-0 z-50 mb-16 md:mb-0 flex justify-center"
      style={{ maxWidth: visible ? '1280px' : '100%' }}
    >
      {/* Desktop Navbar */}
      <motion.div
        animate={{
          backdropFilter: "blur(16px)",
          borderRadius: visible ? "50px" : "0px",
          width: visible ? "90%" : "100%",
          y: visible ? 16 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          duration: 0.3,
        }}
        className="relative z-[60] hidden max-w-7xl mx-auto flex-row items-center justify-between px-8 py-4 md:flex shadow-2xl border border-border/20 bg-background/80 dark:bg-background/90"
        style={{ 
          backdropFilter: 'blur(16px)',
          borderRadius: visible ? '50px' : '0px'
        }}
      >
        <div className="flex w-full items-center justify-between">
          <motion.h1
            animate={{
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="text-xl font-bold text-foreground tracking-wider font-montserrat cursor-pointer flex items-center gap-2"
            onClick={() => scrollToSection('#home')}
          >
            <FaHatCowboy className="w-6 h-6" />
            {visible ? "Wild West" : "Wild West Arena"}
          </motion.h1>

          <motion.nav
            animate={{
              opacity: 1,
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="absolute left-1/2 flex -translate-x-1/2 items-center space-x-2"
          >
            {navItems.map((item, idx) => (
              <NavItem key={idx} item={item} onNavigate={() => scrollToSection(item.link)} />
            ))}
          </motion.nav>

          {/* Auth Section */}
          <motion.div
            animate={{
              scale: visible ? 0.9 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="flex items-center space-x-4"
          >
            {/* Theme Toggle */}
            <ThemeToggle 
              variant="ghost" 
              size="sm"
              className="text-foreground hover:bg-accent border border-border"
            />
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* User Profile */}
                <div className="flex items-center space-x-2 bg-accent/30 rounded-lg px-3 py-2 border border-border">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.photoURL || '/default-cowboy-avatar.png'} alt={user.displayName} />
                    <AvatarFallback><FaUser /></AvatarFallback>
                  </Avatar>
                  <div className="text-foreground">
                    <p className="font-inter text-sm font-medium">{user.displayName}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.cowboyLevel || 'Rookie'}
                    </Badge>
                  </div>
                </div>
                
                {/* Dashboard Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleAuthAction}
                    variant="secondary"
                    size="sm"
                    className="font-inter font-semibold shadow-lg"
                  >
                    <FaTachometerAlt className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </motion.div>

                {/* Logout Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    size="sm"
                    className="font-inter font-semibold shadow-lg"
                  >
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleAuthAction}
                  variant="secondary"
                  className="font-inter font-semibold px-6 py-2 shadow-lg tracking-wide"
                >
                  Join Arena
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile navbar */}
      <motion.div
        animate={{
          backdropFilter: "blur(16px)",
          borderRadius: visible ? "50px" : "0px",
          marginLeft: visible ? "16px" : "0px",
          marginRight: visible ? "16px" : "0px",
          y: visible ? 16 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
        className="md:hidden max-w-7xl mx-auto flex items-center justify-between px-6 py-4 mt-4 shadow-2xl border border-border/20 bg-background/80 dark:bg-background/90"
        style={{ 
          backdropFilter: 'blur(16px)',
          borderRadius: visible ? '50px' : '0px',
          marginLeft: visible ? '16px' : '0px',
          marginRight: visible ? '16px' : '0px'
        }}
      >
        <motion.h1
          animate={{
            scale: visible ? 0.9 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          className="text-lg font-bold text-foreground tracking-wider font-montserrat flex items-center gap-2 cursor-pointer"
          onClick={() => scrollToSection('#home')}
        >
          <FaHatCowboy className="w-5 h-5" />
          {visible ? "WWA" : "Wild West Arena"}
        </motion.h1>

        <div className="flex items-center space-x-2">
          {/* Mobile Theme Toggle */}
          <ThemeToggle 
            variant="ghost" 
            size="sm"
            className="text-foreground hover:bg-accent border border-border"
          />
          
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="sm"
            className="text-foreground p-2 bg-accent/50 border border-border hover:bg-accent"
          >
            {mobileMenuOpen ? (
              <FaTimes className="w-5 h-5" />
            ) : (
              <FaBars className="w-5 h-5" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4"
          >
            <div className="bg-background/95 backdrop-blur-xl border-2 border-border rounded-2xl p-4 space-y-3 shadow-2xl">
              {navItems.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.link);
                  }}
                  className="block w-full text-left text-foreground py-3 px-4 rounded-xl hover:bg-accent transition-colors font-inter font-medium tracking-wide"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ x: 4 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  {item.name}
                </motion.a>
              ))}

              {/* Mobile Theme Toggle */}
              <div className="pt-3 mt-3">
                <Separator className="mb-3 bg-border" />
                <ThemeToggle 
                  variant="ghost"
                  size="default"
                  showLabel={true}
                  className="w-full text-foreground hover:bg-accent border border-border justify-start"
                />
              </div>

              {/* Mobile Auth */}
              <div className="pt-3 mt-3">
                <Separator className="mb-3 bg-border" />
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-accent/50 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.photoURL || '/default-cowboy-avatar.png'} alt={user.displayName} />
                        <AvatarFallback><FaUser /></AvatarFallback>
                      </Avatar>
                      <div className="text-foreground">
                        <p className="font-inter font-medium">{user.displayName}</p>
                        <Badge variant="secondary" className="text-xs">
                          {user.cowboyLevel || 'Rookie'}
                        </Badge>
                      </div>
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleAuthAction}
                        variant="secondary"
                        className="w-full font-inter font-semibold"
                      >
                        <FaTachometerAlt className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full font-inter font-semibold"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleAuthAction}
                      variant="secondary"
                      className="w-full font-inter font-semibold tracking-wide"
                    >
                      Join Arena
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Navigation Item with hover effect
const NavItem = ({ item, onNavigate }) => {
  return (
    <motion.a
      href={item.link}
      onClick={(e) => {
        e.preventDefault();
        onNavigate();
      }}
      className="relative px-4 py-2 text-sm font-medium text-foreground tracking-wide font-inter"
      whileHover="hover"
      initial="initial"
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
      }}
    >
      <span className="relative z-10">{item.name}</span>
      <motion.span 
        className="absolute inset-0 rounded-full bg-accent border border-border"
        initial={{ scale: 0.8, opacity: 0 }}
        variants={{
          initial: { scale: 0.8, opacity: 0 },
          hover: { scale: 1, opacity: 1 }
        }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 25,
        }}
      />
    </motion.a>
  );
};

export default NavbarComponent;