'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  href: string;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
  delay?: number;
}

export default function AnimatedButton({ 
  href, 
  variant = 'primary', 
  children,
  delay = 0
}: AnimatedButtonProps) {
  const baseClasses = "inline-flex h-11 items-center justify-center rounded-md px-8 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link
        href={href}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}