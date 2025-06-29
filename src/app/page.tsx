'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedText } from '@/components/ui/AnimatedText';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ScrollRevealSection from '@/components/ui/ScrollRevealSection';
import { ArrowRight, BarChart3, Clock, FileText, Globe, Shield, Truck, CheckCircle2, Settings } from 'lucide-react';

export default function Home() {
  return (
    <main className="px-0 py-0 mx-0 max-w-full overflow-hidden">
      {/* Hero Section - Minimal Design */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-background/95 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient orbs */}
          <div 
            className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(80, 33, 114, 0.15), transparent 70%)',
              animation: 'float 20s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full"
            style={{
              background: 'radial-gradient(circle at center, rgba(208, 20, 20, 0.15), transparent 70%)',
              animation: 'float 25s ease-in-out infinite reverse'
            }}
          />
          
          {/* Secondary floating elements */}
          <div 
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at center, rgba(80, 33, 114, 0.1), transparent 60%)',
              animation: 'floatSmall 15s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full mix-blend-overlay"
            style={{
              background: 'radial-gradient(circle at center, rgba(208, 20, 20, 0.1), transparent 60%)',
              animation: 'floatSmall 18s ease-in-out infinite reverse'
            }}
          />

          {/* Subtle noise texture */}
          <div 
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden'
            }}
          />

          {/* Moving gradient lines */}
          <div 
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
            style={{
              background: 'linear-gradient(45deg, transparent 48%, rgba(80, 33, 114, 0.1) 50%, transparent 52%), linear-gradient(-45deg, transparent 48%, rgba(208, 20, 20, 0.1) 50%, transparent 52%)',
              backgroundSize: '60px 60px',
              animation: 'gradientMove 8s linear infinite'
            }}
          />
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(50px, 50px) rotate(2deg); }
            50% { transform: translate(0, 100px) rotate(-1deg); }
            75% { transform: translate(-50px, 50px) rotate(1deg); }
          }

          @keyframes floatSmall {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(25px, -25px) scale(1.05); }
            50% { transform: translate(0, -50px) scale(1); }
            75% { transform: translate(-25px, -25px) scale(0.95); }
          }

          @keyframes gradientMove {
            0% { background-position: 0 0; }
            100% { background-position: 60px 60px; }
          }
        `}</style>

        {/* Content */}
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414]">
                  Streamline Your Plant
                </span>
                <br />
                <span className="text-foreground">
                  Truck Operations
                </span>
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                A unified platform for end-to-end truck management. From scheduling to exit, optimize every step of your plant operations with real-time visibility.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#502172] to-[#D01414] text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200"
              >
                Get Started <ArrowRight size={16} />
              </Link>
              <Link 
                href="/auth/signin" 
                className="px-8 py-3 border border-border bg-background/50 backdrop-blur-sm rounded-lg font-medium hover:bg-accent transition-all duration-200"
              >
                Sign In
              </Link>
            </motion.div>

            {/* App Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="relative mt-16"
            >
              <div className="relative mx-auto max-w-3xl">
                <div className="bg-background rounded-xl shadow-2xl overflow-hidden border border-border">
                  <div className="p-2 border-b border-border bg-muted/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <Image
                    src="/appscreen.png"
                    alt="LPMS Dashboard Preview"
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="bg-background border-t border-border py-20">
        <div className="container mx-auto px-6">
          <ScrollRevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { 
                  label: 'Processing Time', 
                  value: '45%', 
                  subtext: 'Reduction in TAT',
                  icon: <Clock className="h-6 w-6 text-[#502172]" /> 
                },
                { 
                  label: 'Daily Truck Entries', 
                  value: '250+', 
                  subtext: 'Efficiently processed',
                  icon: <Truck className="h-6 w-6 text-[#D01414]" /> 
                },
                { 
                  label: 'System Uptime', 
                  value: '99.9%', 
                  subtext: 'Enterprise reliability',
                  icon: <Settings className="h-6 w-6 text-[#502172]" /> 
                },
                { 
                  label: 'Dock Utilization', 
                  value: '38%', 
                  subtext: 'Increased efficiency',
                  icon: <BarChart3 className="h-6 w-6 text-[#D01414]" /> 
                }
              ].map((stat, i) => (
                <div key={i} className="relative group p-6 bg-background rounded-xl border border-border hover:border-[#502172]/20 transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 p-3 bg-gradient-to-br from-[#502172]/5 to-[#D01414]/5 rounded-lg group-hover:from-[#502172]/10 group-hover:to-[#D01414]/10 transition-colors">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414]">
                      {stat.value}
                    </div>
                    <div className="mt-2 font-medium text-foreground">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {stat.subtext}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <ScrollRevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414]">
                  Comprehensive Plant Management
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete ecosystem of integrated modules designed to optimize every aspect of your plant's logistics operations
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Truck className="h-8 w-8" />,
                  title: "Smart Scheduling",
                  description: "Advanced truck scheduling and management system for transporters with real-time tracking.",
                  features: [
                    "Self-service scheduling portal",
                    "Real-time slot availability",
                    "Automated notifications",
                    "Schedule history tracking",
                    "Operational efficiency metrics"
                  ]
                },
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Gate Management",
                  description: "Comprehensive gate security and verification system with digital documentation.",
                  features: [
                    "QR code verification",
                    "Digital documentation",
                    "Security compliance checks",
                    "Plant tracking system",
                    "Entry processing KPIs"
                  ]
                },
                {
                  icon: <BarChart3 className="h-8 w-8" />,
                  title: "Weighbridge System",
                  description: "Automated weighing operations with digital records and compliance tracking.",
                  features: [
                    "Automated weight recording",
                    "Digital weight receipts",
                    "Compliance verification",
                    "Weight history tracking",
                    "Performance analytics"
                  ]
                },
                {
                  icon: <Settings className="h-8 w-8" />,
                  title: "Dock Operations",
                  description: "Real-time dock management and operation tracking system.",
                  features: [
                    "Live dock status monitoring",
                    "Loading/unloading tracking",
                    "Dock utilization metrics",
                    "Operation history logging",
                    "Performance reporting"
                  ]
                },
                {
                  icon: <Globe className="h-8 w-8" />,
                  title: "LED Display System",
                  description: "Dynamic LED screen management for real-time status display across your facility.",
                  features: [
                    "Real-time status updates",
                    "Customizable displays",
                    "Multi-screen support",
                    "Automated notifications",
                    "Display configuration"
                  ]
                },
                {
                  icon: <FileText className="h-8 w-8" />,
                  title: "Administration Hub",
                  description: "Centralized administration and management tools for complete operational control.",
                  features: [
                    "Role-based access control",
                    "Master data management",
                    "Shift handover system",
                    "Audit trail tracking",
                    "KPI dashboards"
                  ]
                }
              ].map((feature, i) => (
                <div key={i} className="group relative bg-background rounded-xl border border-border p-6 hover:border-[#502172]/20 transition-all duration-300">
                  <div className="mb-4 p-3 inline-flex bg-gradient-to-br from-[#502172]/5 to-[#D01414]/5 rounded-lg group-hover:from-[#502172]/10 group-hover:to-[#D01414]/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, j) => (
                      <li key={j} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-[#502172]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <ScrollRevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414] mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Join leading enterprises that have transformed their logistics operations with our platform
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Global Manufacturing Corp",
                  role: "Manufacturing",
                  image: "M",
                  quote: "The platform has transformed our plant logistics, providing complete visibility from truck scheduling to exit, reducing congestion and improving throughput.",
                  stats: {
                    improvement: "45%",
                    metric: "reduction in truck turnaround time"
                  }
                },
                {
                  name: "International Logistics Ltd",
                  role: "Logistics",
                  image: "L",
                  quote: "Self-service scheduling and real-time tracking have significantly improved our delivery efficiency and reduced detention charges.",
                  stats: {
                    improvement: "60%",
                    metric: "fewer scheduling conflicts"
                  }
                },
                {
                  name: "Enterprise Solutions Inc",
                  role: "Technology",
                  image: "T",
                  quote: "The end-to-end visibility from gate to dock to exit has eliminated information silos and dramatically improved our operational efficiency.",
                  stats: {
                    improvement: "38%",
                    metric: "increase in dock utilization"
                  }
                }
              ].map((testimonial, i) => (
                <div 
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#502172] to-[#D01414] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <span className="text-xl font-bold text-white">{testimonial.image}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-300 italic mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414]">
                        {testimonial.stats.improvement}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.stats.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
        <div className="container mx-auto px-6 relative z-10">
          <ScrollRevealSection>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414] mx-2">
                  Transform
                </span>
                Your Plant Operations?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join leading manufacturers who have optimized their operations with our comprehensive truck management platform.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/auth/signup" 
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#502172] to-[#D01414] text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200"
                >
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/contact" 
                  className="px-8 py-3 border border-border bg-background rounded-lg font-medium hover:bg-accent transition-all duration-200"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </ScrollRevealSection>
        </div>
      </section>
    </main>
  );
}