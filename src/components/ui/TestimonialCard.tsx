'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  delay?: number;
}

export default function TestimonialCard({
  quote,
  author,
  role,
  company,
  delay = 0
}: TestimonialCardProps) {
  return (
    <motion.div 
      className="bg-card rounded-lg p-6 shadow-md border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <div className="mb-4">
        {/* Quote icon */}
        <svg 
          className="h-8 w-8 text-primary/40" 
          fill="currentColor" 
          viewBox="0 0 32 32" 
          aria-hidden="true"
        >
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
      </div>
      <p className="text-lg mb-6 italic text-muted-foreground">{quote}</p>
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {author.charAt(0)}
        </div>
        <div className="ml-3">
          <p className="font-medium">{author}</p>
          <p className="text-sm text-muted-foreground">{role}, {company}</p>
        </div>
      </div>
    </motion.div>
  );
}