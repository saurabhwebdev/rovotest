'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { CheckCircle2 } from 'lucide-react';

interface DockOperation {
  id: string;
  truckNumber: string;
  dockId: string;
  dockName: string;
  operationType: 'LOADING' | 'UNLOADING';
  startTime: Timestamp;
  endTime: Timestamp | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  weighbridgeEntryId: string;
}

export default function DockOperationsList() {
  const [operations, setOperations] = useState<DockOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchDockOperations();

    // Set up interval to update the current time every second
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchDockOperations = async () => {
    try {
      const q = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'IN_PROGRESS'),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const operationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DockOperation[];
      setOperations(operationsData);
    } catch (error) {
      console.error('Error fetching dock operations:', error);
    } finally {
      setLoading(false);
    }
  };

  async function handleComplete(operation: DockOperation) {
    try {
      const now = Timestamp.now();

      // 1. Update dock operation status
      await updateDoc(doc(db, 'dockOperations', operation.id), {
        status: 'COMPLETED',
        endTime: now
      });

      // 2. Get weighbridge entry
      const weighbridgeRef = doc(db, 'weighbridgeEntries', operation.weighbridgeEntryId);
      const weighbridgeDoc = await getDoc(weighbridgeRef);
      
      if (weighbridgeDoc.exists()) {
        const weighbridgeData = weighbridgeDoc.data();
        
        // 3. Update weighbridge entry status
        await updateDoc(weighbridgeRef, {
          status: operation.operationType === 'LOADING' ? 'LOADING_COMPLETED' : 'UNLOADING_COMPLETED',
          currentDockId: null,
          dockOperationId: null,
          completedDockOperations: [...(weighbridgeData.completedDockOperations || []), operation.id]
        });

        // 4. Update plant tracking if exists
        if (weighbridgeData.plantTrackingId) {
          await updateDoc(doc(db, 'plantTracking', weighbridgeData.plantTrackingId), {
            location: 'Exit Gate',
            status: operation.operationType === 'LOADING' ? 'LOADING_COMPLETED' : 'UNLOADING_COMPLETED',
            dockId: null,
            dockOperationId: null,
            lastUpdated: now
          });
        }
      }

      // 5. Refresh the list
      fetchDockOperations();
    } catch (error) {
      console.error('Error completing dock operation:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Truck Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Dock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Operation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Start Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {operations.map((operation) => (
            <tr key={operation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {operation.truckNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {operation.dockName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {operation.operationType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {operation.startTime.toDate().toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {getDuration(operation.startTime.toDate(), currentTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                  In Progress
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleComplete(operation)}
                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  title="Complete Operation"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getDuration(startTime: Date, currentTime: Date): string {
  const diff = currentTime.getTime() - startTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
} 