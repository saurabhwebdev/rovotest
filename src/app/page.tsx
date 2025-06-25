'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedText } from '@/components/ui/AnimatedText';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ScrollRevealSection from '@/components/ui/ScrollRevealSection';
import { ArrowRight, BarChart3, Clock, FileText, Globe, Shield, Truck } from 'lucide-react';

export default function Home() {
  return (
    <main className="px-0 py-0 mx-0 max-w-full overflow-hidden">
      {/* Hero Section - Modern Enterprise Style */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#502172] via-[#502172]/90 to-[#D01414] text-white overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_500px_at_50%_200px,rgba(208,20,20,0.3),transparent)]" />
            <div className="absolute inset-0" style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }} />
          </div>
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#502172] rounded-full mix-blend-multiply filter blur-[128px] animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#D01414] rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#502172] rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto px-6 py-12 md:py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#502172]/40 to-white">
                  Enterprise Logistics <br />
                  <span className="text-[#D01414]">Management</span> Platform
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
                <Link href="/auth/signup" className="group relative px-8 py-3 bg-white text-[#502172] rounded-md font-medium overflow-hidden">
                  <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#502172] to-[#D01414] transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                  <div className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-[250ms]">
                    Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link href="/auth/signin" className="px-8 py-3 bg-transparent border border-white/30 text-white rounded-md font-medium hover:bg-white/10 backdrop-blur-sm transition-colors">
                  Sign In
                </Link>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-white/10">
                <div className="bg-white/5 p-6">
                  <div className="bg-gradient-to-b from-gray-900/90 to-gray-800/90 rounded-xl shadow-lg overflow-hidden border border-white/10">
                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                      <h3 className="font-medium text-gray-200">Logistics Dashboard</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Active Trucks', value: '127', color: 'from-blue-500/20 to-blue-600/20', icon: '🚛' },
                          { label: 'On Time', value: '94%', color: 'from-green-500/20 to-green-600/20', icon: '⏰' },
                          { label: 'Waiting', value: '12', color: 'from-amber-500/20 to-amber-600/20', icon: '⌛' }
                        ].map((stat, i) => (
                          <div key={i} className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl border border-white/10 backdrop-blur-sm`}>
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <div className="text-sm text-gray-300">{stat.label}</div>
                            <div className="text-xl font-bold text-white mt-1">{stat.value}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="h-32 bg-gray-800/50 rounded-xl overflow-hidden relative border border-gray-700/50">
                        <div className="absolute inset-0 flex items-end">
                          {[40, 65, 35, 70, 50, 80, 60].map((h, i) => (
                            <div 
                              key={i} 
                              className="w-1/7 h-full flex items-end px-1"
                            >
                              <div 
                                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
                                style={{ height: `${h}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { name: 'Dock A-12', status: 'Active', time: '12:42', color: 'bg-green-500' },
                          { name: 'Dock B-05', status: 'Waiting', time: '13:15', color: 'bg-yellow-500' },
                          { name: 'Dock C-03', status: 'Complete', time: '11:30', color: 'bg-blue-500' },
                        ].map((dock, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${dock.color}`}></div>
                              <span className="text-gray-200">{dock.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-400">{dock.status}</span>
                              <span className="text-sm text-gray-300">{dock.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-yellow-500/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl"></div>
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Enterprise-Grade Solutions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Our comprehensive platform provides end-to-end visibility and control over your logistics operations
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Truck className="h-8 w-8" />,
                  title: "Fleet Management",
                  description: "Real-time tracking, route optimization, and comprehensive fleet analytics for maximum efficiency."
                },
                {
                  icon: <BarChart3 className="h-8 w-8" />,
                  title: "Advanced Analytics",
                  description: "Powerful business intelligence with customizable dashboards and predictive insights."
                },
                {
                  icon: <FileText className="h-8 w-8" />,
                  title: "Documentation Control",
                  description: "Centralized document management with automated workflows and compliance tracking."
                },
                {
                  icon: <Shield className="h-8 w-8" />,
                  title: "Security & Compliance",
                  description: "Enterprise-grade security with role-based access control and audit logging."
                },
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: "Real-time Monitoring",
                  description: "Live tracking of all operations with instant alerts and notifications."
                },
                {
                  icon: <Globe className="h-8 w-8" />,
                  title: "Global Scalability",
                  description: "Multi-location support with localization and region-specific compliance."
                }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 dark:border-gray-700"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg inline-block mb-4">
                    <div className="text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                See how enterprises around the world transform their logistics operations
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl font-bold">{String.fromCharCode(64 + i)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Enterprise Client {i}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Global Logistics</div>
                    </div>
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-300 italic mb-6">
                    "The LPMS platform has transformed our logistics operations, providing unprecedented visibility and control across our entire supply chain."
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium">ROI:</span> 215%
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-800 text-white">
        <div className="container mx-auto px-6">
          <ScrollRevealSection direction="up">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to transform your logistics operations?
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join industry leaders who trust our enterprise platform for their mission-critical logistics operations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/signup" className="px-8 py-3 bg-white text-indigo-900 rounded-md font-medium hover:bg-blue-50 transition-colors">
                  Request Demo
                </Link>
                <Link href="/auth/signin" className="px-8 py-3 bg-transparent border border-white text-white rounded-md font-medium hover:bg-white/10 transition-colors">
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