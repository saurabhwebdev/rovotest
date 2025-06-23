'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { generateQRValue } from '@/lib/utils';
import { updateDocument, updateTruckStatus, addDocument } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface Truck {
  id: string;
  driverName: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  status: string;
  gate: string;
  createdAt: string;
  approvalStatus?: string;
  [key: string]: any;
}

interface TruckListProps {
  trucks: Truck[];
  loading: boolean;
}

export default function TruckList({ trucks, loading }: TruckListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [sortField, setSortField] = useState<keyof Truck>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [isNewSchedule, setIsNewSchedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<Truck | any>({
    reportingDate: '',
    reportingTime: '',
    gate: '',
    driverName: '',
    mobileNumber: '',
    licenseNumber: '',
    vehicleNumber: '',
    transporterName: '',
    depotName: '',
    lrNumber: '',
    rtoPassingCapacity: '',
    loadingCapacity: '',
    supplierName: '',
    rcNumber: '',
    insuranceNumber: '',
    pollutionNumber: '',
    dlValidityDate: '',
    rcValidityDate: '',
    insuranceValidityDate: '',
    pollutionValidityDate: ''
  });

  const handleSort = (field: keyof Truck) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewQR = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowQRModal(true);
  };

  const handleEdit = (truck: Truck) => {
    // Store the truck ID in localStorage and redirect to the scheduling form
    if (typeof window !== 'undefined') {
      localStorage.setItem('editTruckId', truck.id);
      router.push('/transporter/schedule');
    }
  };

  const handleCancel = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowCancelModal(true);
    setCancellationReason('');
    setCancelError('');
  };

  const confirmCancel = async () => {
    if (!selectedTruck) return;
    
    setCancelLoading(true);
    setCancelError('');
    
    try {
      // Update the truck status to cancelled
      await updateTruckStatus(selectedTruck.id, 'cancelled');
      
      // Create audit trail entry for cancellation
      if (user) {
        await addDocument('truckSchedulingAudit', {
          truckId: selectedTruck.id,
          vehicleNumber: selectedTruck.vehicleNumber,
          action: 'Cancelled',
          timestamp: new Date().toISOString(),
          userId: user.uid,
          userName: user.displayName || user.email || 'Unknown User',
          details: {
            reason: cancellationReason || 'No reason provided'
          }
        });
      }
      
      // Close the modal
      setShowCancelModal(false);
      
      // Force refresh the data
      router.refresh();
    } catch (error) {
      console.error('Error cancelling truck:', error);
      setCancelError('Failed to cancel truck. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReschedule = (truck: Truck) => {
    setSelectedTruck(truck);
    setRescheduleData({
      ...truck,
      reportingDate: truck.reportingDate,
      reportingTime: truck.reportingTime,
      gate: truck.gate
    });
    setRescheduleError('');
    setRescheduleSuccess(false);
    setIsNewSchedule(false);
    setShowRescheduleModal(true);
  };

  const handleRescheduleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRescheduleData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleScheduleTypeToggle = (newSchedule: boolean) => {
    setIsNewSchedule(newSchedule);
  };

  const confirmReschedule = async () => {
    if (!selectedTruck) return;
    
    setRescheduleLoading(true);
    setRescheduleError('');
    setRescheduleSuccess(false);
    
    try {
      // Make sure all required fields are filled
      if (!rescheduleData.reportingDate || !rescheduleData.reportingTime || !rescheduleData.gate) {
        throw new Error('Please fill in all required fields');
      }
      
      const currentTime = new Date().toISOString();
      
      if (isNewSchedule) {
        // Create a new schedule entry
        const newTruckData = {
          ...rescheduleData,
          status: 'scheduled',
          createdAt: currentTime,
          updatedAt: currentTime
        };
        
        // Remove the ID to generate a new one
        delete newTruckData.id;
        
        // Add the new truck
        const newTruckId = await addDocument('trucks', newTruckData);
        
        // Create audit trail entry for new schedule
        if (user) {
          await addDocument('truckSchedulingAudit', {
            truckId: newTruckId,
            vehicleNumber: rescheduleData.vehicleNumber,
            action: 'Rescheduled (New)',
            timestamp: currentTime,
            userId: user.uid,
            userName: user.displayName || user.email || 'Unknown User',
            details: {
              originalTruckId: selectedTruck.id,
              newScheduleData: rescheduleData
            }
          });
        }
      } else {
        // Update existing truck data with all fields from the form
        await updateDocument('trucks', selectedTruck.id, {
          ...rescheduleData,
          // If the truck was cancelled before, change status back to scheduled
          status: selectedTruck.status === 'cancelled' ? 'scheduled' : selectedTruck.status,
          updatedAt: currentTime
        });
        
        // Create audit trail entry for reschedule
        if (user) {
          await addDocument('truckSchedulingAudit', {
            truckId: selectedTruck.id,
            vehicleNumber: rescheduleData.vehicleNumber,
            action: 'Rescheduled',
            timestamp: currentTime,
            userId: user.uid,
            userName: user.displayName || user.email || 'Unknown User',
            details: {
              previousData: {
                reportingDate: selectedTruck.reportingDate,
                reportingTime: selectedTruck.reportingTime,
                gate: selectedTruck.gate
              },
              newData: {
                reportingDate: rescheduleData.reportingDate,
                reportingTime: rescheduleData.reportingTime,
                gate: rescheduleData.gate
              }
            }
          });
        }
      }
      
      setRescheduleSuccess(true);
      
      // Close the modal after a delay
      setTimeout(() => {
        setShowRescheduleModal(false);
        // Force refresh the data
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error('Error rescheduling truck:', error);
      setRescheduleError(error instanceof Error ? error.message : 'Failed to reschedule truck. Please try again.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const sortedTrucks = [...trucks].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    // Handle dates specially
    if (sortField === 'reportingDate' || sortField === 'createdAt') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (err) {
      return dateString;
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
      <div className="py-10 px-4 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No trucks scheduled</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You haven't scheduled any trucks yet. Click "Schedule New Truck" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
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
                <span>Reporting Date</span>
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
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedTrucks.map((truck) => (
            <tr 
              key={truck.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <div className="flex items-center space-x-1">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs" title="Click to copy">
                    {truck.id}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(truck.id);
                      // Show a temporary tooltip or feedback
                      const el = document.createElement('div');
                      el.className = 'absolute bg-black text-white text-xs rounded px-2 py-1 right-0 -top-8 z-10';
                      el.textContent = 'Copied!';
                      el.style.opacity = '0.8';
                      el.style.transition = 'opacity 1s';
                      document.activeElement?.parentElement?.appendChild(el);
                      setTimeout(() => {
                        el.style.opacity = '0';
                        setTimeout(() => el.remove(), 1000);
                      }, 1000);
                    }}
                    className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                    title="Copy ID"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
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
                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(truck.status, truck.approvalStatus)}`}>
                  {getStatusLabel(truck)}
                </span>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleViewQR(truck)}
                    className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                    title="View QR Code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleEdit(truck)}
                    className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleCancel(truck)}
                    className="text-gray-500 hover:text-red-600 focus:outline-none"
                    title="Cancel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleReschedule(truck)}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none"
                    title="Reschedule/New Schedule"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* QR Code Modal */}
      {showQRModal && selectedTruck && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Truck QR Code</h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Truck Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Vehicle Number:</span>
                      <span>{selectedTruck.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Driver Name:</span>
                      <span>{selectedTruck.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Transporter:</span>
                      <span>{selectedTruck.transporterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reporting Date:</span>
                      <span>{formatDate(selectedTruck.reportingDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Reporting Time:</span>
                      <span>{selectedTruck.reportingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Gate:</span>
                      <span>{selectedTruck.gate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTruck.status, selectedTruck.approvalStatus)}`}>
                        {getStatusLabel(selectedTruck)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="bg-white p-4 rounded">
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">QR Code Preview</div>
                    <div className="border-2 border-gray-300 dark:border-gray-700 p-2 rounded">
                      <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <QRCodeSVG value={generateQRValue(selectedTruck.id)} size={200} className="qr-code-view" />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Scan this QR code at the gate for quick check-in
                  </p>
                  <button
                    onClick={() => {
                      // Get the SVG element
                      const svgElement = document.querySelector(".qr-code-view");
                      if (svgElement) {
                        // Create a canvas element
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        
                        // Set canvas dimensions
                        canvas.width = 200;
                        canvas.height = 200;
                        
                        // Create an image from the SVG
                        const img = new Image();
                        const svgData = new XMLSerializer().serializeToString(svgElement);
                        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                        const url = URL.createObjectURL(svgBlob);
                        
                        img.onload = function() {
                          // Draw the image on the canvas
                          ctx?.drawImage(img, 0, 0);
                          URL.revokeObjectURL(url);
                          
                          // Create a download link
                          const downloadLink = document.createElement("a");
                          downloadLink.href = canvas.toDataURL("image/png");
                          downloadLink.download = `truck-qr-${selectedTruck.vehicleNumber || selectedTruck.id}.png`;
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        };
                        
                        img.src = url;
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR Code
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedTruck && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cancel Truck</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to cancel this truck?
                </p>
                <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <div className="text-sm">
                    <p><span className="font-medium">Vehicle Number:</span> {selectedTruck.vehicleNumber}</p>
                    <p><span className="font-medium">Driver:</span> {selectedTruck.driverName}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTruck.status, selectedTruck.approvalStatus)}`}>
                        {getStatusLabel(selectedTruck)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={confirmCancel}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedTruck && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Reschedule Truck</h2>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Current Schedule</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Vehicle Number:</span> {selectedTruck.vehicleNumber}
                  </div>
                  <div>
                    <span className="font-medium">Driver:</span> {selectedTruck.driverName}
                  </div>
                  <div>
                    <span className="font-medium">Reporting Date:</span> {formatDate(selectedTruck.reportingDate)}
                  </div>
                  <div>
                    <span className="font-medium">Reporting Time:</span> {selectedTruck.reportingTime}
                  </div>
                  <div>
                    <span className="font-medium">Gate:</span> {selectedTruck.gate}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedTruck.status, selectedTruck.approvalStatus)}`}>
                      {getStatusLabel(selectedTruck)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-medium mb-2">Reschedule Options</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Choose how you want to reschedule this truck.
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-indigo-600"
                        checked={!isNewSchedule}
                        onChange={() => handleScheduleTypeToggle(false)}
                      />
                      <span className="ml-2">Update Existing Schedule</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-indigo-600"
                        checked={isNewSchedule}
                        onChange={() => handleScheduleTypeToggle(true)}
                      />
                      <span className="ml-2">Create New Schedule</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3">
                    <h3 className="text-lg font-medium">Schedule Information</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reporting Date
                        </label>
                        <input
                          type="date"
                          name="reportingDate"
                          value={rescheduleData.reportingDate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reporting Time
                        </label>
                        <input
                          type="time"
                          name="reportingTime"
                          value={rescheduleData.reportingTime}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Gate
                        </label>
                        <select
                          name="gate"
                          value={rescheduleData.gate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="">Select Gate</option>
                          <option value="Gate 1">Gate 1</option>
                          <option value="Gate 2">Gate 2</option>
                          <option value="Gate 3">Gate 3</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          name="driverName"
                          value={rescheduleData.driverName}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          name="mobileNumber"
                          value={rescheduleData.mobileNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          License Number
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={rescheduleData.licenseNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Vehicle Number
                        </label>
                        <input
                          type="text"
                          name="vehicleNumber"
                          value={rescheduleData.vehicleNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Transporter Name
                        </label>
                        <input
                          type="text"
                          name="transporterName"
                          value={rescheduleData.transporterName}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Depot Name
                        </label>
                        <input
                          type="text"
                          name="depotName"
                          value={rescheduleData.depotName}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          LR Number
                        </label>
                        <input
                          type="text"
                          name="lrNumber"
                          value={rescheduleData.lrNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          RTO Passing Capacity
                        </label>
                        <input
                          type="text"
                          name="rtoPassingCapacity"
                          value={rescheduleData.rtoPassingCapacity}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Loading Capacity
                        </label>
                        <input
                          type="text"
                          name="loadingCapacity"
                          value={rescheduleData.loadingCapacity}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Supplier Name
                        </label>
                        <input
                          type="text"
                          name="supplierName"
                          value={rescheduleData.supplierName}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          RC Number
                        </label>
                        <input
                          type="text"
                          name="rcNumber"
                          value={rescheduleData.rcNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Insurance Number
                        </label>
                        <input
                          type="text"
                          name="insuranceNumber"
                          value={rescheduleData.insuranceNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pollution Number
                        </label>
                        <input
                          type="text"
                          name="pollutionNumber"
                          value={rescheduleData.pollutionNumber}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          DL Validity Date
                        </label>
                        <input
                          type="date"
                          name="dlValidityDate"
                          value={rescheduleData.dlValidityDate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          RC Validity Date
                        </label>
                        <input
                          type="date"
                          name="rcValidityDate"
                          value={rescheduleData.rcValidityDate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Insurance Validity Date
                        </label>
                        <input
                          type="date"
                          name="insuranceValidityDate"
                          value={rescheduleData.insuranceValidityDate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Pollution Validity Date
                        </label>
                        <input
                          type="date"
                          name="pollutionValidityDate"
                          value={rescheduleData.pollutionValidityDate}
                          onChange={handleRescheduleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReschedule}
                  disabled={rescheduleLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rescheduleLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {rescheduleError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
                  {rescheduleError}
                </div>
              )}

              {rescheduleSuccess && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
                  Schedule updated successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 