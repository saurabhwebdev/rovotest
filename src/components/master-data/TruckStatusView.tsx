'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Truck {
  id: string;
  vehicleNumber: string;
  driverName: string;
  transporterName: string;
  status: string;
  currentLocation?: string;
  gate?: string;
  updatedAt?: string;
}

export default function TruckStatusView() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'trucks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trucksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Truck[];
      
      // Sort by updatedAt in descending order
      trucksData.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setTrucks(trucksData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching trucks:', err);
      setError('Failed to load trucks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'in-process':
        return 'In Process';
      case 'pending-approval':
        return 'Pending Approval';
      case 'inside-plant':
        return 'Inside Plant';
      case 'at_dock':
        return 'At Dock';
      case 'at_parking':
        return 'At Parking';
      case 'at_weighbridge':
        return 'At Weighbridge';
      case 'at_loading':
        return 'At Loading';
      case 'at_unloading':
        return 'At Unloading';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-process':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending-approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'inside-plant':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'at_dock':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'at_parking':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      case 'at_weighbridge':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'at_loading':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'at_unloading':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredTrucks = trucks.filter(truck => 
    truck.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.transporterName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search trucks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transporter</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gate</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.vehicleNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.driverName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.transporterName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(truck.status)}`}>
                      {getStatusDisplay(truck.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.gate || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 