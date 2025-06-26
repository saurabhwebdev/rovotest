'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TruckSchedulingForm from '@/components/transporter/TruckSchedulingForm';

export default function SchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Force a hard redirect to the sign-in page
      window.location.href = '/auth/signin';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <button 
            onClick={() => router.push('/transporter')}
            className="mr-3 text-gray-500 hover:text-indigo-600 focus:outline-none"
            aria-label="Back to Transporter Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Schedule Truck</h1>
        </div>
        <TruckSchedulingForm 
          onSuccess={() => {
            router.push('/transporter');
          }}
        />
      </div>
    </div>
  );
} 