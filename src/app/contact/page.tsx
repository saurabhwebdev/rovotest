'use client';

import { useState } from 'react';
import { addDocument } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    agreeToPrivacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({});
    
    try {
      // Add the contact form submission to Firestore
      await addDocument('contactSubmissions', {
        ...formData,
        status: 'new',
        submittedAt: new Date().toISOString()
      });
      
      setSubmitStatus({
        success: true,
        message: 'Your message has been sent successfully! We will get back to you soon.'
      });
      
      // Reset the form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        agreeToPrivacy: false
      });
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        success: false,
        message: 'There was an error sending your message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Get in Touch</h2>
            <p className="mb-4">
              Have questions about our Logistics Process Management System? Our team is here to help.
              Please use the form or contact information below to reach out to us.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Headquarters</h3>
                <address className="not-italic mt-1">
                  LPMS Headquarters<br />
                  123 Logistics Way<br />
                  Enterprise City, EC 12345<br />
                  United States
                </address>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Support</h3>
                <p className="mt-1">
                  <strong>Email:</strong> support@lpms.com<br />
                  <strong>Phone:</strong> +1 (555) 123-4567<br />
                  <strong>Hours:</strong> 24/7 Support
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Sales</h3>
                <p className="mt-1">
                  <strong>Email:</strong> sales@lpms.com<br />
                  <strong>Phone:</strong> +1 (555) 987-6543<br />
                  <strong>Hours:</strong> Monday-Friday, 9AM-5PM EST
                </p>
              </div>
            </div>
          </section>

          {/* Company Logos Strip */}
          <section className="pt-8 pb-2 overflow-hidden border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Our Trusted Partners</h3>
            <div className="relative w-full">
              <div className="flex animate-scroll py-1">
                {/* First set of logos */}
                <div className="flex items-center gap-12 shrink-0">
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/mondelez-international-logo-brandlogos.net_y90djgdu1.svg"
                      alt="Mondelez International"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/mondelez-international-logo-brandlogos.net_y90djgdu1.svg"
                      alt="Mondelez International"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="flex items-center gap-12 shrink-0">
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/mondelez-international-logo-brandlogos.net_y90djgdu1.svg"
                      alt="Mondelez International"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/mondelez-international-logo-brandlogos.net_y90djgdu1.svg"
                      alt="Mondelez International"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                  <div className="group">
                    <Image
                      src="/companyicon/blue-dart-express-logo-brandlogos.net_59eftdx92.svg"
                      alt="Blue Dart Express"
                      width={100}
                      height={35}
                      className="relative opacity-40 hover:opacity-60 transition-opacity duration-300 dark:invert dark:opacity-30 dark:hover:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Send us a Message</h2>
          
          {submitStatus.message && (
            <div className={`p-4 mb-4 rounded-md ${submitStatus.success ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
              {submitStatus.message}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Your name"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="your.email@company.com"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="How can we help you?"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Please provide details about your inquiry..."
                required
                disabled={isSubmitting}
              ></textarea>
            </div>
            
            <div className="flex items-center">
              <input
                id="agreeToPrivacy"
                name="agreeToPrivacy"
                type="checkbox"
                checked={formData.agreeToPrivacy}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                required
                disabled={isSubmitting}
              />
              <label htmlFor="agreeToPrivacy" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the <a href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Privacy Policy</a>
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            We'll get back to you within 24 hours.
          </p>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white">What is LPMS?</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              LPMS (Logistics Process Management System) is an enterprise solution designed to streamline and optimize logistics operations, 
              including truck scheduling, gate management, dock operations, weighbridge processes, and related activities.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white">How do I request a demo?</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              You can request a demo by filling out the contact form above or by directly emailing sales@lpms.com with your company details 
              and requirements.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white">Is technical support included?</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Yes, all LPMS subscriptions include 24/7 technical support. Enterprise clients also receive dedicated account managers 
              and priority response times.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-900 dark:text-white">Can LPMS integrate with our existing systems?</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Yes, LPMS is designed with integration capabilities for common ERP, WMS, and TMS systems. Our implementation team will 
              work with you to ensure smooth integration with your existing infrastructure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 