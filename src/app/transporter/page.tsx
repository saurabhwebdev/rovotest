'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocumentsWhere } from '@/lib/firestore';
import TruckList from '@/components/transporter/TruckList';
import TruckSchedulingForm from '@/components/transporter/TruckSchedulingForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HelpIcon from '@/components/ui/HelpIcon';
import { transporterHelp } from '@/lib/helpContent';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function TransporterPage() {
  const { user, loading: authLoading } = useAuth();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/signin';
    }
  }, [user, authLoading]);
  
  const fetchTrucks = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      const fetchedTrucks = await getDocumentsWhere('trucks', 'userId', '==', user.uid);
      
      setTrucks(fetchedTrucks);
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError('Failed to load truck data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && !authLoading) {
      fetchTrucks();
    }
  }, [user, authLoading]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will be redirected by the useEffect
  }
  
  return (
    <PagePermissionWrapper pageId="transporter">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Transporter Dashboard</h1>
            <HelpIcon moduleHelp={transporterHelp} />
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center sm:justify-start text-sm sm:text-base w-full sm:w-auto"
          >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Schedule New Truck
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 sm:mb-6 text-sm sm:text-base">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <TruckList 
          trucks={trucks} 
          loading={loading} 
        />
      </div>
      
      {/* Schedule Truck Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold">Schedule New Truck</h2>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 sm:p-6">
              <TruckSchedulingForm 
                onSuccess={() => {
                  setShowScheduleModal(false);
                  fetchTrucks();
                }}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </PagePermissionWrapper>
  );
}