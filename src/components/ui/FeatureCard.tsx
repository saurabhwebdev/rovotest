'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div 
      className="rounded-lg border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="mb-4 text-3xl text-primary"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
        viewport={{ once: true }}
      >
        {icon}
      </motion.div>
      <motion.h3 
        className="mb-2 text-xl font-bold"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.3 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h3>
      <motion.p 
        className="text-muted-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.4 }}
        viewport={{ once: true }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}