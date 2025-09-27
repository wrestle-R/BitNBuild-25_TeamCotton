import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AdminBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Floating sheriff badges */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-16 opacity-[0.03]"
          initial={{ 
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            rotate: 0 
          }}
          animate={{ 
            y: [null, Math.random() * -100, Math.random() * 100],
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-primary">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </motion.div>
      ))}
      
      {/* Animated grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Spotlight effect */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [100, Math.max(100, dimensions.width - 100), 100],
            y: [100, Math.max(100, dimensions.height - 100), 100],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

export default AdminBackground;