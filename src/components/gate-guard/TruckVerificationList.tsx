'use client';

import { useState, useEffect } from 'react';
import { getTrucksForGateGuard } from '@/lib/firestore';
import { collection, getDocs, DocumentData, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TruckVerificationModal from '@/components/gate-guard/TruckVerificationModal';
import TruckDetailsModal from '@/components/gate-guard/TruckDetailsModal';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { Info, LogOut, CheckCircle } from 'lucide-react';

interface Truck {
  id: string;
  driverName: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  status: string;
  gate: string;
  createdAt: any;
  locationUpdatedAt?: any;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  currentLocation?: string;
  mobileNumber: string;
  licenseNumber: string;
  depotName?: string;
  lrNumber?: string;
  rtoPassingCapacity?: string;
  loadingCapacity?: string;
  supplierName?: string;
  rcNumber?: string;
  insuranceNumber?: string;
  pollutionNumber?: string;
  dlValidityDate?: string;
  rcValidityDate?: string;
  insuranceValidityDate?: string;
  pollutionValidityDate?: string;
  destination?: string;
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
  const [isMobileView, setIsMobileView] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchTrucks();
    
    // Check if mobile view on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const checkIfMobile = () => {
    setIsMobileView(window.innerWidth < 768);
  };

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'trucks'));
      const trucksData = snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        locationUpdatedAt: doc.data().locationUpdatedAt?.toDate?.() || doc.data().locationUpdatedAt,
      })) as Truck[];
      setTrucks(trucksData);
    } catch (err) {
      console.error('Error fetching trucks:', err);
      setError('Failed to load trucks');
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
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-process':
      case 'in_process':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending-approval':
      case 'pending_approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'inside-plant':
      case 'inside_plant':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'at_dock':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'at_parking':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'at_weighbridge':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'loading_completed':
      case 'unloading_completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'exit_ready':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'exited':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'Scheduled';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'in-process':
      case 'in_process':
        return 'In Process';
      case 'pending-approval':
      case 'pending_approval':
        return 'Pending Approval';
      case 'inside-plant':
      case 'inside_plant':
        return 'Inside Plant';
      case 'at_dock':
        return 'At Dock';
      case 'at_parking':
        return 'At Parking';
      case 'at_weighbridge':
        return 'At Weighbridge';
      case 'loading_completed':
        return 'Loading Completed';
      case 'unloading_completed':
        return 'Unloading Completed';
      case 'exit_ready':
        return 'Ready for Exit';
      case 'exited':
        return 'Exited Plant';
      default:
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

  const handleProcessExit = async (truck: Truck) => {
    try {
      // Update truck status to exited
      const truckRef = doc(db, 'trucks', truck.id);
      await updateDoc(truckRef, {
        status: 'exited',
        exitTime: Timestamp.now(),
        exitProcessedBy: user?.uid || 'unknown',
        currentLocation: 'Outside Plant'
      });

      // Create audit entry
      await addDoc(collection(db, 'gateGuardAudit'), {
        truckNumber: truck.vehicleNumber,
        driverName: truck.driverName,
        transporterName: truck.transporterName,
        action: 'EXIT_PROCESSED',
        timestamp: new Date(),
        performedBy: user?.uid || 'unknown',
        performedByName: user?.displayName || 'Unknown User',
        details: {
          exitTime: new Date(),
          previousStatus: truck.status
        }
      });

      // Close modal and refresh the list
      setShowExitConfirmModal(false);
      setSelectedTruck(null);
      fetchTrucks();
    } catch (error) {
      console.error('Error processing truck exit:', error);
    }
  };

  const openExitConfirmModal = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowExitConfirmModal(true);
  };

  const closeExitConfirmModal = () => {
    setSelectedTruck(null);
    setShowExitConfirmModal(false);
  };

  // Add filter options for status
  const renderStatusFilter = () => {
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('scheduled')}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            filterStatus === 'scheduled'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Scheduled
        </button>
        <button
          onClick={() => setFilterStatus('exit_ready')}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            filterStatus === 'exit_ready'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Exit Ready
        </button>
        <button
          onClick={() => setFilterStatus('verified')}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            filterStatus === 'verified'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Verified
        </button>
        <button
          onClick={() => setFilterStatus('pending-approval')}
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            filterStatus === 'pending-approval'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Pending Approval
        </button>
      </div>
    );
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Mobile Card View
  const renderMobileCards = () => {
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        {filteredTrucks.map(truck => (
          <div 
            key={truck.id} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{truck.vehicleNumber}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(truck.status)}`}>
                {getStatusDisplay(truck.status)}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Driver:</span> {truck.driverName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Transporter:</span> {truck.transporterName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Reporting:</span> {formatDate(truck.reportingDate)} {formatTime(truck.reportingTime)}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleViewDetails(truck)}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 flex items-center"
                aria-label="View Details"
                title="View Details"
              >
                <Info className="h-4 w-4 mr-1" />
                <span>Details</span>
              </button>
              
              {truck.status === 'exit_ready' ? (
                <button
                  onClick={() => openExitConfirmModal(truck)}
                  className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800 flex items-center"
                  aria-label="Process Exit"
                  title="Process Exit"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Process Exit</span>
                </button>
              ) : truck.status === 'scheduled' || truck.status === 'verified' ? (
                <button
                  onClick={() => handleVerifyTruck(truck)}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 flex items-center"
                  aria-label="Verify"
                  title="Verify"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Verify</span>
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Desktop Table View
  const renderDesktopTable = () => {
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('vehicleNumber')}
            >
              Truck Number
              {sortField === 'vehicleNumber' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('driverName')}
            >
              Driver
              {sortField === 'driverName' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('transporterName')}
            >
              Transporter
              {sortField === 'transporterName' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('reportingDate')}
            >
              Reporting Time
              {sortField === 'reportingDate' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status
              {sortField === 'status' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTrucks.map((truck) => (
            <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {truck.vehicleNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {truck.driverName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {truck.transporterName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatDate(truck.reportingDate)} {formatTime(truck.reportingTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(truck.status)}`}>
                  {getStatusDisplay(truck.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleViewDetails(truck)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  aria-label="View Details"
                  title="View Details"
                >
                  <Info className="h-5 w-5" />
                </button>
                
                {truck.status === 'exit_ready' ? (
                  <button
                    onClick={() => openExitConfirmModal(truck)}
                    className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                    aria-label="Process Exit"
                    title="Process Exit"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                ) : truck.status === 'scheduled' || truck.status === 'verified' ? (
                  <button
                    onClick={() => handleVerifyTruck(truck)}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    aria-label="Verify"
                    title="Verify"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search by truck number, driver, or transporter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {renderStatusFilter()}
        </div>
      </div>

      {filteredTrucks.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">No trucks found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Toggle between mobile and desktop view */}
          {isMobileView ? renderMobileCards() : renderDesktopTable()}
        </>
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

      {/* Exit Confirmation Modal */}
      {selectedTruck && showExitConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Confirm Truck Exit
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to process the exit for truck <span className="font-semibold">{selectedTruck.vehicleNumber}</span>?
                This will mark the truck as exited from the plant.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeExitConfirmModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleProcessExit(selectedTruck)}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-md"
                >
                  Confirm Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}