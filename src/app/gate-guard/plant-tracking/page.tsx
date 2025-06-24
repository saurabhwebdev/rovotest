'use client';

import { useAuth } from '@/contexts/AuthContext';
import PlantTruckList from '@/components/gate-guard/PlantTruckList';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function PlantTrackingPage() {
  const { user } = useAuth();

  return (
    <PagePermissionWrapper pageId="gate-guard-plant-tracking">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Plant Truck Tracking</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor truck positions and movements inside the plant</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Auto-refresh every 30s
              </div>
            </div>
          </div>

          <PlantTruckList />
        </div>
      </div>
    </PagePermissionWrapper>
  );
}