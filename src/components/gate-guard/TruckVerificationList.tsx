'use client';

import { useState, useEffect } from 'react';
import { getCollection } from '@/lib/firestore';
import TruckVerificationModal from '@/components/gate-guard/TruckVerificationModal';
import TruckDetailsModal from '@/components/gate-guard/TruckDetailsModal';
import { Input } from '@/components/ui/input';

interface Truck {
  id: string;
  driverName: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  gate: string;
  status: string;
  createdAt: string;
  mobileNumber: string;
  licenseNumber: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
}

export default function TruckVerificationList() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<keyof Truck>('reportingDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const trucksData = await getCollection('trucks') as Truck[];
      setTrucks(trucksData);
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError('Failed to load scheduled trucks');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowVerificationModal(true);
  };

  const handleViewDetails = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowDetailsModal(true);
  };

  const handleSort = (field: keyof Truck) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const sortedTrucks = [...trucks].sort((a, b) => {
    let aValue: string | number = a[sortField] as string;
    let bValue: string | number = b[sortField] as string;
    
    if (sortField === 'reportingDate') {
      aValue = new Date(`${a.reportingDate}T${a.reportingTime}`).toISOString();
      bValue = new Date(`${b.reportingDate}T${b.reportingTime}`).toISOString();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredTrucks = sortedTrucks.filter(truck => {
    const matchesSearch = 
      truck.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.transporterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || truck.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search trucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <svg
              className="absolute right-2 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="verified">Verified</option>
              <option value="inside-plant">Inside Plant</option>
              <option value="rejected">Rejected</option>
              <option value="in-process">In Process</option>
            </select>
            
            <button 
              className="ml-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Refresh List"
              onClick={fetchTrucks}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {filteredTrucks.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">No trucks found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th 
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('vehicleNumber')}
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
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('driverName')}
                >
                  <div className="flex items-center">
                    <span>Driver Name</span>
                    {sortField === 'driverName' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-3 w-3 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center">
                    <span>Mobile Number</span>
                  </div>
                </th>
                <th 
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('transporterName')}
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
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('reportingDate')}
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
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('reportingTime')}
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
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('gate')}
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
                  className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => handleSort('status')}
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
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">{truck.vehicleNumber}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{truck.driverName}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{truck.mobileNumber}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{truck.transporterName}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{formatDate(truck.reportingDate)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{formatTime(truck.reportingTime)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{truck.gate}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(truck.status)}`}>
                      {truck.status === 'pending-approval' && truck.approvalStatus === 'approved' ? 'Exception Approval' : truck.status}
                    </span>
                    {truck.status === 'pending-approval' && truck.approvalStatus === 'pending' && (
                      <span className="ml-1 px-1 py-0.5 text-xs rounded-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Awaiting
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewDetails(truck)}
                        className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleVerifyTruck(truck)}
                        className="text-gray-500 hover:text-green-600 focus:outline-none"
                        disabled={truck.status !== 'scheduled'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && selectedTruck && (
        <TruckVerificationModal
          truck={selectedTruck}
          onClose={() => {
            setShowVerificationModal(false);
            fetchTrucks(); // Refresh the list after verification
          }}
          onVerificationComplete={() => {
            setShowVerificationModal(false);
            fetchTrucks(); // Refresh the list after verification
          }}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTruck && (
        <TruckDetailsModal
          truck={selectedTruck}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}