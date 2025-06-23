'use client';

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AnimatedText } from '@/components/ui/AnimatedText'
import AnimatedButton from '@/components/ui/AnimatedButton'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import FeatureCard from '@/components/ui/FeatureCard'
import TestimonialCard from '@/components/ui/TestimonialCard'
import ScrollRevealSection from '@/components/ui/ScrollRevealSection'
import HeroBackground from '@/components/ui/HeroBackground'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <HeroBackground />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <AnimatedText 
            text={["LPMS - Logistics Park", "Management System"]}
            el="h1"
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            animation={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                }
              }
            }}
          />
          <ScrollRevealSection delay={0.5}>
            <p className="mb-10 text-xl text-muted-foreground">
              Streamline your logistics operations with our comprehensive park management solution
            </p>
          </ScrollRevealSection>
          <div className="flex flex-wrap justify-center gap-4">
            <AnimatedButton href="/auth/signup" variant="primary" delay={0.7}>
              Get Started
            </AnimatedButton>
            <AnimatedButton href="/auth/signin" variant="secondary" delay={0.9}>
              Sign In
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollRevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <AnimatedCounter 
                  end={500} 
                  suffix="+" 
                  className="text-4xl md:text-5xl font-bold text-primary block" 
                />
                <span className="text-muted-foreground mt-2 block">Logistics Parks</span>
              </div>
              <div>
                <AnimatedCounter 
                  end={10000} 
                  suffix="+" 
                  className="text-4xl md:text-5xl font-bold text-primary block" 
                  delay={0.2}
                />
                <span className="text-muted-foreground mt-2 block">Daily Shipments</span>
              </div>
              <div>
                <AnimatedCounter 
                  end={98} 
                  suffix="%" 
                  className="text-4xl md:text-5xl font-bold text-primary block" 
                  delay={0.4}
                />
                <span className="text-muted-foreground mt-2 block">Customer Satisfaction</span>
              </div>
              <div>
                <AnimatedCounter 
                  end={24} 
                  suffix="/7" 
                  className="text-4xl md:text-5xl font-bold text-primary block" 
                  delay={0.6}
                />
                <span className="text-muted-foreground mt-2 block">Support Available</span>
              </div>
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <ScrollRevealSection>
          <div className="mx-auto max-w-7xl">
            <AnimatedText 
              text="Key Features"
              el="h2"
              className="mb-12 text-center text-3xl font-bold"
            />
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                }
                title="Inventory Management"
                description="Track and manage your inventory in real-time with advanced analytics and reporting."
                delay={0.1}
              />
              <FeatureCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                }
                title="Logistics Tracking"
                description="Monitor shipments and deliveries with precision GPS tracking and status updates."
                delay={0.3}
              />
              <FeatureCard
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <path d="M12 2v4"></path>
                    <path d="M12 18v4"></path>
                    <path d="M4.93 4.93l2.83 2.83"></path>
                    <path d="M16.24 16.24l2.83 2.83"></path>
                    <path d="M2 12h4"></path>
                    <path d="M18 12h4"></path>
                    <path d="M4.93 19.07l2.83-2.83"></path>
                    <path d="M16.24 7.76l2.83-2.83"></path>
                  </svg>
                }
                title="Analytics Dashboard"
                description="Gain insights with comprehensive analytics and customizable reporting tools."
                delay={0.5}
              />
            </div>
          </div>
        </ScrollRevealSection>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <ScrollRevealSection>
            <AnimatedText 
              text="What Our Clients Say"
              el="h2"
              className="mb-12 text-center text-3xl font-bold"
            />
            <div className="grid gap-8 md:grid-cols-3">
              <TestimonialCard 
                quote="LPMS has transformed how we manage our logistics park. The real-time tracking and analytics have improved our efficiency by 40%."
                author="Sarah Johnson"
                role="Operations Director"
                company="Global Logistics Inc."
                delay={0.1}
              />
              <TestimonialCard 
                quote="The inventory management system is intuitive and powerful. We've reduced errors by 85% since implementing LPMS."
                author="Michael Chen"
                role="Supply Chain Manager"
                company="FastTrack Shipping"
                delay={0.3}
              />
              <TestimonialCard 
                quote="Customer support is exceptional. Any issues we've had were resolved quickly, and the team is always open to feature suggestions."
                author="Priya Patel"
                role="IT Director"
                company="EuroTrans Logistics"
                delay={0.5}
              />
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <ScrollRevealSection direction="up">
          <div className="mx-auto max-w-4xl rounded-lg bg-primary p-8 text-center text-primary-foreground shadow-lg overflow-hidden relative">
            {/* Background animated gradient */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80"></div>
              <div className="absolute -inset-[100%] animate-[spin_20s_linear_infinite] bg-gradient-conic from-blue-900/30 via-transparent to-transparent"></div>
            </div>
            
            <AnimatedText 
              text="Ready to optimize your logistics operations?"
              el="h2"
              className="mb-4 text-3xl font-bold"
            />
            <ScrollRevealSection delay={0.2}>
              <p className="mb-6 text-lg">
                Join thousands of logistics professionals who trust LPMS for their park management needs.
              </p>
            </ScrollRevealSection>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/auth/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-primary ring-offset-background transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Sign Up Now
              </Link>
            </motion.div>
          </div>
        </ScrollRevealSection>
      </section>
    </main>
  )
}