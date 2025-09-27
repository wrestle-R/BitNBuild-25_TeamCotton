import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground({
  children,
  className,
  transition = {
    type: 'spring',
    bounce: 0.2,
    duration: 0.6,
  },
  enableHover = false,
}) {
  const [activeId, setActiveId] = useState(null);
  const [hoveredRect, setHoveredRect] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function updateMousePosition(event) {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Find which child element is being hovered
      const elements = ref.current.querySelectorAll('[data-id]');
      let hoveredElement = null;
      
      elements.forEach((element) => {
        const elementRect = element.getBoundingClientRect();
        const relativeRect = {
          left: elementRect.left - rect.left,
          top: elementRect.top - rect.top,
          width: elementRect.width,
          height: elementRect.height,
        };
        
        if (
          x >= relativeRect.left &&
          x <= relativeRect.left + relativeRect.width &&
          y >= relativeRect.top &&
          y <= relativeRect.top + relativeRect.height
        ) {
          hoveredElement = {
            ...relativeRect,
            id: element.getAttribute('data-id'),
          };
        }
      });
      
      if (hoveredElement) {
        setActiveId(hoveredElement.id);
        setHoveredRect(hoveredElement);
      } else {
        setActiveId(null);
        setHoveredRect(null);
      }
    }
    
    if (enableHover) {
      ref.current?.addEventListener('mousemove', updateMousePosition);
      ref.current?.addEventListener('mouseleave', () => {
        setActiveId(null);
        setHoveredRect(null);
      });
    }
    
    return () => {
      if (ref.current) {
        ref.current.removeEventListener('mousemove', updateMousePosition);
      }
    };
  }, [enableHover]);

  return (
    <div ref={ref} className="relative">
      {children}
      {hoveredRect && (
        <motion.div
          className={`absolute ${className} pointer-events-none`}
          layoutId="activeBackground"
          initial={false}
          animate={{
            x: hoveredRect.left,
            y: hoveredRect.top,
            width: hoveredRect.width,
            height: hoveredRect.height,
          }}
          transition={transition}
        />
      )}
    </div>
  );
}