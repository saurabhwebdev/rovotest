'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface Truck {
  id: string;
  driverName: string;
  mobileNumber: string;
  licenseNumber: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  gate: string;
  sourceLocation?: string;
  destination?: string;
  status: string;
  createdAt: string | { seconds: number, nanoseconds: number };
  updatedAt: string | { seconds: number, nanoseconds: number };
  approvalStatus?: string;
  userId: string;
  actualArrivalTime?: string | { seconds: number, nanoseconds: number };
  exitTime?: string | { seconds: number, nanoseconds: number };
}

interface TruckScheduleHistoryProps {
  trucks: Truck[];
  loading: boolean;
}

const TruckCard = ({ truck, formatDate, getStatusColor, getStatusLabel }: { 
  truck: Truck; 
  formatDate: (date: string | { seconds: number, nanoseconds: number }) => string;
  getStatusColor: (status: string, approvalStatus?: string) => string;
  getStatusLabel: (truck: Truck) => string;
}) => {
  return (
    <Card className="p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{truck.vehicleNumber}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {truck.id.substring(0, 8)}...</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(truck.status, truck.approvalStatus)}`}>
          {getStatusLabel(truck)}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Vehicle Number</span>
          <span className="font-medium">{truck.vehicleNumber}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Driver</span>
          <span className="font-medium">{truck.driverName}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Transporter</span>
          <span className="font-medium">{truck.transporterName}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Gate</span>
          <span className="font-medium">{truck.gate}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Date</span>
          <span className="font-medium">{formatDate(truck.reportingDate)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500 dark:text-gray-400 text-xs">Time</span>
          <span className="font-medium">{truck.reportingTime}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex flex-col space-y-2 text-xs">
          {truck.actualArrivalTime && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Actual Arrival:</span>
              <span>{(() => {
                try {
                  if (typeof truck.actualArrivalTime === 'object' && truck.actualArrivalTime !== null && 'seconds' in truck.actualArrivalTime) {
                    // Handle Firestore timestamp
                    return format(new Date((truck.actualArrivalTime as any).seconds * 1000), 'MMM dd, yyyy HH:mm');
                  }
                  return format(new Date(truck.actualArrivalTime), 'MMM dd, yyyy HH:mm');
                } catch (err) {
                  return String(truck.actualArrivalTime) || 'N/A';
                }
              })()}</span>
            </div>
          )}
          {truck.exitTime && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Exit Time:</span>
              <span>{(() => {
                try {
                  if (typeof truck.exitTime === 'object' && truck.exitTime !== null && 'seconds' in truck.exitTime) {
                    // Handle Firestore timestamp
                    return format(new Date((truck.exitTime as any).seconds * 1000), 'MMM dd, yyyy HH:mm');
                  }
                  return format(new Date(truck.exitTime), 'MMM dd, yyyy HH:mm');
                } catch (err) {
                  return String(truck.exitTime) || 'N/A';
                }
              })()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Created:</span>
            <span>{(() => {
              try {
                if (typeof truck.createdAt === 'object' && truck.createdAt !== null && 'seconds' in truck.createdAt) {
                  // Handle Firestore timestamp
                  return format(new Date((truck.createdAt as any).seconds * 1000), 'MMM dd, yyyy HH:mm');
                }
                return format(new Date(truck.createdAt), 'MMM dd, yyyy HH:mm');
              } catch (err) {
                return String(truck.createdAt) || 'N/A';
              }
            })()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function TruckScheduleHistory({ trucks, loading }: TruckScheduleHistoryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof Truck>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check screen size on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // 768px is standard md breakpoint in Tailwind
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSort = (field: keyof Truck) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter trucks based on search term
  const filteredTrucks = trucks.filter(truck => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      truck.vehicleNumber.toLowerCase().includes(searchLower) ||
      truck.driverName.toLowerCase().includes(searchLower) ||
      truck.transporterName.toLowerCase().includes(searchLower) ||
      truck.id.toLowerCase().includes(searchLower)
    );
  });

  const sortedTrucks = [...filteredTrucks].sort((a, b) => {
    let valueA: any = a[sortField];
    let valueB: any = b[sortField];

    // Handle dates specially
    if (sortField === 'reportingDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
      // Handle Firestore timestamps
      if (typeof valueA === 'object' && valueA !== null && 'seconds' in valueA) {
        valueA = valueA.seconds * 1000;
      } else {
        valueA = new Date(valueA as string).getTime();
      }
      
      if (typeof valueB === 'object' && valueB !== null && 'seconds' in valueB) {
        valueB = valueB.seconds * 1000;
      } else {
        valueB = new Date(valueB as string).getTime();
      }
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string | { seconds: number, nanoseconds: number }) => {
    try {
      if (typeof dateString === 'object' && dateString !== null && 'seconds' in dateString) {
        // Handle Firestore timestamp
        return format(new Date(dateString.seconds * 1000), 'MMM dd, yyyy');
      }
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (err) {
      return String(dateString) || 'N/A';
    }
  };

  const getStatusColor = (status: string, approvalStatus?: string) => {
    if (status === 'pending-approval' && approvalStatus === 'approved') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'arrived':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending-approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'inside-plant':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const statusLabels: Record<string, string | ((truck: Truck) => string)> = {
    'scheduled': 'Scheduled',
    'arrived': 'Arrived',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'inside-plant': 'Inside Plant',
    'pending-approval': (truck: Truck) => {
      return truck.approvalStatus === 'approved' ? 'Exception Approval' : 'Pending Approval';
    }
  };

  const getStatusLabel = (truck: Truck) => {
    if (truck.status === 'pending-approval' && truck.approvalStatus === 'approved') {
      return 'Exception Approval';
    }
    
    const label = statusLabels[truck.status];
    if (typeof label === 'function') {
      return label(truck);
    }
    return label || truck.status;
  };

  if (loading) {
    return (
      <div className="py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trucks.length === 0) {
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">No processed trucks found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Search by vehicle number, driver, or transporter..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
                     dark:bg-gray-800 dark:text-white text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Mobile view - card layout */}
      {isMobileView ? (
        <div className="px-4 py-2">
          {sortedTrucks.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />
          ))}
        </div>
      ) : (
        /* Desktop view - table layout */
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Truck ID</span>
                    {sortField === 'id' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortField === 'status' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('vehicleNumber')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Vehicle Number</span>
                    {sortField === 'vehicleNumber' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('driverName')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Driver</span>
                    {sortField === 'driverName' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('transporterName')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Transporter</span>
                    {sortField === 'transporterName' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reportingDate')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Date</span>
                    {sortField === 'reportingDate' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reportingTime')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Time</span>
                    {sortField === 'reportingTime' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('gate')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Gate</span>
                    {sortField === 'gate' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('updatedAt')}
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Last Updated</span>
                    {sortField === 'updatedAt' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTrucks.map((truck) => (
                <tr 
                  key={truck.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/70"
                >
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.id.substring(0, 8)}...
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(truck.status, truck.approvalStatus)}`}>
                      {getStatusLabel(truck)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.vehicleNumber}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.driverName}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.transporterName}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {formatDate(truck.reportingDate)}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.reportingTime}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {truck.gate}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    {(() => {
                      try {
                        if (typeof truck.updatedAt === 'object' && truck.updatedAt !== null && 'seconds' in truck.updatedAt) {
                          // Handle Firestore timestamp
                          return format(new Date((truck.updatedAt as any).seconds * 1000), 'MMM dd, yyyy HH:mm');
                        }
                        return format(new Date(truck.updatedAt), 'MMM dd, yyyy HH:mm');
                      } catch (err) {
                        return String(truck.updatedAt) || 'N/A';
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
} 