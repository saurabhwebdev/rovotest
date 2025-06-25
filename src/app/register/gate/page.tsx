'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface GateRegisterEntry {
  id: string;
  vehicleNumber: string;
  driverName: string;
  entryTime: string;
  exitTime?: string;
  purpose: string;
  status: 'in-plant' | 'exited' | 'pending';
}

export default function GateRegisterPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<GateRegisterEntry[]>([]);

  useEffect(() => {
    // In a real implementation, this would fetch data from Firestore
    // For now, we're using mock data
    const fetchEntries = () => {
      setLoading(true);
      
      // Mock data
      const mockEntries: GateRegisterEntry[] = [
        {
          id: '1',
          vehicleNumber: 'MH01AB1234',
          driverName: 'John Doe',
          entryTime: '2023-08-10 08:30 AM',
          exitTime: '2023-08-10 02:45 PM',
          purpose: 'Delivery',
          status: 'exited'
        },
        {
          id: '2',
          vehicleNumber: 'MH02CD5678',
          driverName: 'Jane Smith',
          entryTime: '2023-08-10 09:15 AM',
          purpose: 'Pick-up',
          status: 'in-plant'
        },
        {
          id: '3',
          vehicleNumber: 'DL01EF9012',
          driverName: 'Robert Johnson',
          entryTime: '2023-08-10 10:00 AM',
          exitTime: '2023-08-10 11:30 AM',
          purpose: 'Maintenance',
          status: 'exited'
        },
        {
          id: '4',
          vehicleNumber: 'KA01GH3456',
          driverName: 'Sarah Williams',
          entryTime: '2023-08-10 11:45 AM',
          purpose: 'Delivery',
          status: 'in-plant'
        },
        {
          id: '5',
          vehicleNumber: 'TN01IJ7890',
          driverName: 'Michael Brown',
          entryTime: '2023-08-11 08:00 AM',
          purpose: 'Service',
          status: 'pending'
        }
      ];
      
      setEntries(mockEntries);
      setLoading(false);
    };
    
    fetchEntries();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in-plant':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Plant</span>;
      case 'exited':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Exited</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Unknown</span>;
    }
  };

  return (
    <PagePermissionWrapper pageId="register-gate">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Gate Register</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              href="/register"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200"
            >
              Back to Registers
            </Link>
            <button
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Entry
            </button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Driver Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Exit Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {entry.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entry.driverName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entry.entryTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entry.exitTime || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entry.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(entry.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                          View
                        </button>
                        {entry.status === 'in-plant' && (
                          <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                            Record Exit
                          </button>
                        )}
                        {entry.status === 'pending' && (
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            Record Entry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PagePermissionWrapper>
  );
} 