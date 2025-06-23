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
      <section className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-white">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundSize: '24px 24px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Enterprise Logistics <span className="text-blue-300">Management</span> Platform
                </h1>
                <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-lg">
                  Streamline operations, enhance visibility, and optimize your logistics park with our comprehensive enterprise solution.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <Link href="/auth/signup" className="px-8 py-3 bg-white text-indigo-900 rounded-md font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link href="/auth/signin" className="px-8 py-3 bg-transparent border border-white text-white rounded-md font-medium hover:bg-white/10 transition-colors">
                  Sign In
                </Link>
              </motion.div>
              
              <motion.div 
                className="flex items-center gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-indigo-900 bg-blue-${i*100} flex items-center justify-center text-xs font-bold`}>
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-200">Trusted by 500+ enterprise companies</p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-white/10 backdrop-blur-sm p-6">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-medium">Logistics Dashboard</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {[
                          { label: 'Active Trucks', value: '127', color: 'bg-blue-100 dark:bg-blue-900' },
                          { label: 'On Time', value: '94%', color: 'bg-green-100 dark:bg-green-900' },
                          { label: 'Waiting', value: '12', color: 'bg-amber-100 dark:bg-amber-900' }
                        ].map((stat, i) => (
                          <div key={i} className={`${stat.color} p-3 rounded-lg`}>
                            <div className="text-sm opacity-70">{stat.label}</div>
                            <div className="text-xl font-bold">{stat.value}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="h-32 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <div className="absolute inset-0 flex items-end">
                          {[40, 65, 35, 70, 50, 80, 60].map((h, i) => (
                            <div 
                              key={i} 
                              className="w-1/7 h-full flex items-end"
                            >
                              <div 
                                className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm" 
                                style={{ height: `${h}%` }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {[
                          { name: 'Dock A-12', status: 'Active', time: '12:42', color: 'bg-green-500' },
                          { name: 'Dock B-05', status: 'Waiting', time: '13:15', color: 'bg-yellow-500' },
                          { name: 'Dock C-03', status: 'Complete', time: '11:30', color: 'bg-blue-500' },
                        ].map((dock, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${dock.color}`}></div>
                              <span>{dock.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm opacity-70">{dock.status}</span>
                              <span className="text-sm">{dock.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-30 blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-600 rounded-full opacity-30 blur-3xl"></div>
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
                { label: 'Logistics Parks', value: '500+', icon: <Globe className="h-6 w-6 text-blue-500" /> },
                { label: 'Daily Shipments', value: '10,000+', icon: <Truck className="h-6 w-6 text-blue-500" /> },
                { label: 'Uptime SLA', value: '99.9%', icon: <Clock className="h-6 w-6 text-blue-500" /> },
                { label: 'Data Points', value: '1M+', icon: <BarChart3 className="h-6 w-6 text-blue-500" /> }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
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
            
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                TRUSTED BY LEADING ENTERPRISES WORLDWIDE
              </p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="font-bold text-gray-400 dark:text-gray-500">LOGO {i}</span>
                  </div>
                ))}
              </div>
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