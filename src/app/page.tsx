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
      {/* Hero Section - Modern Enterprise Style */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#502172] via-[#502172]/90 to-[#D01414] text-white overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            {/* Gradient orbs with glow effect */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#502172] rounded-full mix-blend-multiply filter blur-[128px] animate-glow" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#D01414] rounded-full mix-blend-multiply filter blur-[128px] animate-glow animation-delay-2000" />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#502172] rounded-full mix-blend-multiply filter blur-[128px] animate-glow animation-delay-4000" />
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 animate-pulse opacity-20" style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }} />
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 md:py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="inline-block bg-clip-text text-transparent bg-[size:200%] bg-gradient-to-r from-white via-[#D01414] to-white animate-gradient">
                    Enterprise Logistics
                  </span>
                  <br />
                  <span className="inline-block bg-clip-text text-transparent bg-[size:200%] bg-gradient-to-r from-[#502172] via-white to-[#D01414] animate-gradient">
                    Management
                  </span>{' '}
                  <span className="inline-block bg-clip-text text-transparent bg-[size:200%] bg-gradient-to-r from-white via-[#502172] to-white animate-gradient">
                    Platform
                  </span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-white/90 max-w-lg leading-relaxed">
                  Streamline operations, enhance visibility, and optimize your logistics park with our comprehensive enterprise solution.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <Link href="/auth/signup" className="group relative px-8 py-3 bg-white text-[#502172] rounded-md font-medium overflow-hidden hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#502172] to-[#D01414] transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                  <div className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-[250ms]">
                    Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link href="/auth/signin" className="px-8 py-3 bg-transparent border border-white/30 text-white rounded-md font-medium hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  Sign In
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative animate-float"
            >
              <div className="bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/10">
                <div className="bg-white/5 p-6">
                  <div className="bg-gradient-to-b from-gray-900/90 to-gray-800/90 rounded-xl shadow-lg overflow-hidden border border-white/10">
                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                      <h3 className="font-medium text-gray-200">Logistics Dashboard</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse animation-delay-2000"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse animation-delay-4000"></div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        {[
                          { name: 'Dock A-12', status: 'Active', time: '12:42', color: 'bg-green-500' },
                          { name: 'Dock B-05', status: 'Waiting', time: '13:15', color: 'bg-yellow-500' },
                          { name: 'Dock C-03', status: 'Complete', time: '11:30', color: 'bg-blue-500' },
                        ].map((dock, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                            className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${dock.color} animate-pulse`}></div>
                              <span className="text-gray-200">{dock.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-400">{dock.status}</span>
                              <span className="text-sm text-gray-300">{dock.time}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-yellow-500/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl animate-glow"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="bg-white dark:bg-gray-900 py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <ScrollRevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { 
                  label: 'Active Clients', 
                  value: '25+', 
                  subtext: 'Growing monthly',
                  icon: <Globe className="h-6 w-6 text-[#502172]" /> 
                },
                { 
                  label: 'Daily Deliveries', 
                  value: '150+', 
                  subtext: 'Across 3 cities',
                  icon: <Truck className="h-6 w-6 text-[#D01414]" /> 
                },
                { 
                  label: 'Platform Uptime', 
                  value: '99.9%', 
                  subtext: 'Enterprise-grade',
                  icon: <Clock className="h-6 w-6 text-[#502172]" /> 
                },
                { 
                  label: 'Client Growth', 
                  value: '38%', 
                  subtext: 'Quarter over quarter',
                  icon: <BarChart3 className="h-6 w-6 text-[#D01414]" /> 
                }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center group hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 p-3 bg-gradient-to-br from-[#502172]/10 to-[#D01414]/10 rounded-full group-hover:from-[#502172]/20 group-hover:to-[#D01414]/20 transition-colors">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414]">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {stat.subtext}
                  </div>
                </div>
              ))}
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* Enterprise Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-6">
          <ScrollRevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#502172] to-[#D01414] mb-4">
                Enterprise-Grade Solutions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our comprehensive platform provides end-to-end visibility and control over your logistics operations, backed by enterprise-level security and scalability
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Truck className="h-8 w-8" />,
                  title: "Fleet Management",
                  description: "Real-time tracking, route optimization, and comprehensive fleet analytics for maximum efficiency.",
                  features: ["Live GPS Tracking", "Route Optimization", "Fuel Efficiency Analysis"]
                },
                {
                  icon: <BarChart3 className="h-8 w-8" />,
                  title: "Advanced Analytics",
                  description: "Powerful business intelligence with customizable dashboards and predictive insights.",
                  features: ["Custom KPI Dashboards", "Predictive Analytics", "Performance Metrics"]
                },
                {
                  icon: <FileText className="h-8 w-8" />,
                  title: "Documentation Control",
                  description: "Centralized document management with automated workflows and compliance tracking.",
                  features: ["Digital Documentation", "Automated Workflows", "Audit Trails"]
                },
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Security & Compliance",
                  description: "Enterprise-grade security with role-based access control and audit logging.",
                  features: ["Role-Based Access", "Data Encryption", "Security Audits"]
                },
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: "Real-time Monitoring",
                  description: "Live tracking of all operations with instant alerts and notifications.",
                  features: ["Live Status Updates", "Instant Notifications", "Performance Alerts"]
                },
                {
                  icon: <Settings className="h-8 w-8" />,
                  title: "Integration Hub",
                  description: "Seamless integration with your existing systems and third-party applications.",
                  features: ["API Integration", "Custom Workflows", "Data Synchronization"]
                }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group"
                >
                  <div className="mb-4 p-3 bg-gradient-to-br from-[#502172]/10 to-[#D01414]/10 rounded-lg inline-block group-hover:from-[#502172]/20 group-hover:to-[#D01414]/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white group-hover:text-[#502172] dark:group-hover:text-[#D01414] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-[#502172] dark:text-[#D01414]" />
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

      {/* Testimonials with Logos Section */}
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
                  quote: "The platform has revolutionized our logistics operations, providing unprecedented visibility and control across our supply chain.",
                  stats: {
                    improvement: "45%",
                    metric: "reduction in processing time"
                  }
                },
                {
                  name: "International Logistics Ltd",
                  role: "Logistics",
                  image: "L",
                  quote: "Real-time tracking and automated workflows have significantly improved our operational efficiency and customer satisfaction.",
                  stats: {
                    improvement: "99.9%",
                    metric: "platform uptime"
                  }
                },
                {
                  name: "Enterprise Solutions Inc",
                  role: "Technology",
                  image: "T",
                  quote: "The seamless integration capabilities and robust security features make this platform stand out in the logistics industry.",
                  stats: {
                    improvement: "60%",
                    metric: "faster dock operations"
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
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#502172] to-[#D01414] opacity-90"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-shift1">
            <svg className="w-[200%] h-[200%]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid1" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid1)"/>
            </svg>
          </div>
          <div className="absolute inset-0 animate-shift2">
            <svg className="w-[200%] h-[200%]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid2" width="15" height="15" patternUnits="userSpaceOnUse">
                <path d="M 15 0 L 0 0 0 15" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid2)"/>
            </svg>
          </div>
          <div className="absolute inset-0 animate-shift3">
            <svg className="w-[200%] h-[200%]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid3)"/>
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <ScrollRevealSection direction="up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to transform your logistics operations?
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join industry leaders who trust our enterprise platform for their mission-critical logistics operations.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link 
                  href="/auth/signup" 
                  className="px-8 py-4 bg-white text-[#502172] rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/contact" 
                  className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-lg font-medium hover:bg-white/10 transition-colors inline-flex items-center group"
                >
                  Contact Sales
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="mt-8 text-white/80 text-sm">
                Enterprise-grade security • 24/7 support • Custom solutions
              </p>
            </div>
          </ScrollRevealSection>
        </div>
      </section>
    </main>
  );
}