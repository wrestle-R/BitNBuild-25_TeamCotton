import { motion } from 'framer-motion';
import { useMemo } from 'react';

export function TextEffect({
  children,
  per = 'word',
  as: Tag = 'div',
  preset = 'fade-in-blur',
  delay = 0,
  speedSegment = 0.1,
  className,
  ...props
}) {
  const text = children;
  
  const segments = useMemo(() => {
    if (per === 'line') {
      return text.split('\n').map((line, index) => ({
        content: line,
        index,
      }));
    }
    
    return text.split(' ').map((word, index) => ({
      content: word,
      index,
    }));
  }, [text, per]);

  const getVariants = () => {
    switch (preset) {
      case 'fade-in-blur':
        return {
          hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 20,
          },
          visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
              type: 'spring',
              bounce: 0.3,
              duration: 1,
            },
          },
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: speedSegment,
        delayChildren: delay,
      },
    },
  };

  return (
    <Tag className={className} {...props}>
      <motion.span
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ display: 'inline-block' }}
      >
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            variants={getVariants()}
            style={{ display: 'inline-block' }}
          >
            {segment.content}
            {per === 'word' && index < segments.length - 1 && ' '}
            {per === 'line' && index < segments.length - 1 && <br />}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}