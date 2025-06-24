'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WeighbridgeTruckList from '@/components/weighbridge/WeighbridgeTruckList';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import HelpIcon from '@/components/ui/HelpIcon';
import { weighbridgeHelp } from '@/lib/helpContent';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

interface Weighbridge {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export default function WeighbridgePage() {
  const { user } = useAuth();
  const [activeWeighbridge, setActiveWeighbridge] = useState<Weighbridge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch active weighbridge
  useEffect(() => {
    const fetchActiveWeighbridge = async () => {
      try {
        const q = query(
          collection(db, 'weighbridges'),
          where('isActive', '==', true)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('No active weighbridge found. Please contact an administrator.');
          setLoading(false);
          return;
        }

        const weighbridgeData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        } as Weighbridge;

        setActiveWeighbridge(weighbridgeData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching active weighbridge:', err);
        setError('Failed to load weighbridge information');
        setLoading(false);
      }
    };

    if (user) {
      fetchActiveWeighbridge();
    }
  }, [user]);

  if (loading) {
    return (
      <PagePermissionWrapper pageId="weighbridge">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </PagePermissionWrapper>
    );
  }

  if (error) {
    return (
      <PagePermissionWrapper pageId="weighbridge">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Weighbridge Not Available
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      </PagePermissionWrapper>
    );
  }

  return (
    <PagePermissionWrapper pageId="weighbridge">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Weighbridge Dashboard</h1>
              <HelpIcon moduleHelp={weighbridgeHelp} />
            </div>
            {activeWeighbridge && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {activeWeighbridge.name} - {activeWeighbridge.location}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Truck Weighing Management</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  All truck weighing operations
                </div>
              </div>
              <WeighbridgeTruckList />
            </div>
          </div>
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 