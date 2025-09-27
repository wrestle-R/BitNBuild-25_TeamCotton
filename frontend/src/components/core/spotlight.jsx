import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export function Spotlight({ className, size = 96, ...props }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPosition({ x, y });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      {...props}
    >
      <motion.div
        className={`pointer-events-none absolute z-0 rounded-full bg-gradient-radial ${className}`}
        style={{
          width: size,
          height: size,
          left: position.x - size / 2,
          top: position.y - size / 2,
        }}
        animate={{
          opacity,
        }}
        transition={{
          opacity: { duration: 0.2 },
        }}
      />
    </div>
  );
}