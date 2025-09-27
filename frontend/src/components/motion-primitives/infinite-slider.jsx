import { motion } from 'framer-motion';
import { useState } from 'react';

export function InfiniteSlider({ 
  children, 
  speed = 40, 
  speedOnHover = 20, 
  gap = 16,
  className,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div
        className="flex"
        animate={{
          x: [0, -100 * children.length],
        }}
        transition={{
          duration: isHovered ? speedOnHover : speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          gap: gap,
          width: `${200 * children.length}%`,
        }}
      >
        {Array.from({ length: 2 }).map((_, setIndex) =>
          children.map((child, childIndex) => (
            <div
              key={`${setIndex}-${childIndex}`}
              style={{
                minWidth: `${100 / children.length}%`,
              }}
            >
              {child}
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
}