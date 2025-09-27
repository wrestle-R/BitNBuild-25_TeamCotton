import { motion } from 'framer-motion';

export function AnimatedGroup({ 
  children, 
  variants, 
  className,
  ...props 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}