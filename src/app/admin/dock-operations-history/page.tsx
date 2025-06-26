'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';

interface DockOperation {
  id: string;
  truckNumber: string;
  dockId: string;
  dockName: string;
  operationType: 'LOADING' | 'UNLOADING';
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'COMPLETED';
  weighbridgeEntryId: string;
}

export default function DockOperationsHistory() {
  const [operations, setOperations] = useState<DockOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedOperations();
  }, []);

  const fetchCompletedOperations = async () => {
    try {
      const q = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'COMPLETED'),
        orderBy('endTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const operationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DockOperation[];
      setOperations(operationsData);
    } catch (error) {
      console.error('Error fetching completed dock operations:', error);
    } finally {
      setLoading(false);
    }
  };

  function getDuration(startTime: Date, endTime: Date): string {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Dock Operations History</h1>
      
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
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
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
                  {operation.endTime.toDate().toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {getDuration(operation.startTime.toDate(), operation.endTime.toDate())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 