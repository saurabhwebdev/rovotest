'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ScrollRevealSectionProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export default function ScrollRevealSection({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = ''
}: ScrollRevealSectionProps) {
  const directionVariants = {
    up: { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down: { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    left: { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  };
  
  const selectedVariant = directionVariants[direction];
  
  return (
    <motion.div
      className={className}
      initial={selectedVariant.initial}
      whileInView={selectedVariant.animate}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
}