import React from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const ThemeToggle = ({ variant = 'default', size = 'default', className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTheme();
  };

  const toggleButton = (
    <Button
      onClick={handleToggle}
      variant={variant}
      size={size}
      className={`relative overflow-hidden transition-all duration-300 ${className} ${
        showLabel ? 'gap-2' : ''
      }`}
    >
      <motion.div
        className="flex items-center gap-2"
        initial={false}
        animate={{
          rotate: isDark ? 180 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {isDark ? (
          <FaMoon className="w-4 h-4" />
        ) : (
          <FaSun className="w-4 h-4" />
        )}
      </motion.div>
      
      {showLabel && (
        <motion.span
          initial={false}
          animate={{ opacity: 1 }}
          className="font-inter font-medium"
        >
          {isDark ? 'Dark' : 'Light'}
        </motion.span>
      )}
      
      {/* Animated background indicator */}
      <motion.div
        className="absolute inset-0 rounded-md opacity-20"
        initial={false}
        animate={{
          background: isDark 
            ? 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))' 
            : 'linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11))',
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        style={{ zIndex: -1 }}
      />
    </Button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {toggleButton}
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to {isDark ? 'light' : 'dark'} theme</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return toggleButton;
};

export default ThemeToggle;