'use client';

import { useState, useEffect } from 'react';
import { updateTruckStatus, sendTruckForApproval } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, Timestamp, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  status: string;
  createdAt: string;
  
  // Additional fields from transporter module
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
  
  // Approval related fields
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalRequestedAt?: string;
  approvalResolvedAt?: string;
  approvalRequestedBy?: string;
  approvalResolvedBy?: string;
  approvalNotes?: string;
  failedChecks?: string[];
  
  // Weighbridge related fields
  weighbridgeId?: string;
}

interface Weighbridge {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

interface VerificationModalProps {
  truck: Truck;
  onClose: () => void;
  onVerificationComplete: () => void;
}

// Create audit entry function
const createAuditEntry = async (truck: Truck, action: string, details: any, user: any) => {
  try {
    await addDoc(collection(db, 'gateGuardAudit'), {
      truckNumber: truck.vehicleNumber,
      driverName: truck.driverName,
      transporterName: truck.transporterName,
      action: action,
      timestamp: new Date(),
      performedBy: user?.uid || 'unknown',
      performedByName: user?.displayName || 'Unknown User',
      details: details
    });
  } catch (error) {
    console.error('Error creating audit entry:', error);
  }
};

export default function TruckVerificationModal({ truck, onClose, onVerificationComplete }: VerificationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'documents', 'compliance'
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [selectedWeighbridge, setSelectedWeighbridge] = useState('');
  const [verificationData, setVerificationData] = useState({
    driverIdentityVerified: false,
    vehicleNumberVerified: false,
    documentsVerified: false,
    safetyEquipmentChecked: false,
    vehicleConditionChecked: false,
    notes: '',
    failedChecks: [] as string[],
    approvalReason: '',
  });

  // Fetch available weighbridges
  useEffect(() => {
    const fetchWeighbridges = async () => {
      const q = query(collection(db, 'weighbridges'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const weighbridgeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Weighbridge[];
        setWeighbridges(weighbridgeData);
        
        // If there's only one active weighbridge, select it automatically
        const activeWeighbridge = weighbridgeData.find(wb => wb.isActive);
        if (activeWeighbridge) {
          setSelectedWeighbridge(activeWeighbridge.id);
        }
      });

      return () => unsubscribe();
    };

    fetchWeighbridges();
  }, []);

  // Initialize verification data based on truck's approval status
  useEffect(() => {
    // If truck is already approved, auto-check basic verification items
    if (truck.status === 'pending-approval' && truck.approvalStatus === 'approved') {
      setVerificationData(prev => ({
        ...prev,
        // Auto-check the items that were previously flagged as failures
        driverIdentityVerified: !truck.failedChecks?.includes('driverIdentity'),
        vehicleNumberVerified: !truck.failedChecks?.includes('vehicleNumber'),
        documentsVerified: !truck.failedChecks?.includes('documents'),
        // Include the approval notes in the verification notes
        notes: `[Approved with notes: ${truck.approvalNotes || 'No approval notes provided'}]`
      }));
    }
  }, [truck]);

  const handleVerificationChange = (field: string, value: boolean | string) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return (
      verificationData.driverIdentityVerified &&
      verificationData.vehicleNumberVerified &&
      verificationData.documentsVerified
    );
  };

  const handleVerify = async (status: 'verified' | 'rejected') => {
    if (status === 'verified' && !isFormValid()) {
      setError('Please complete all required verification checks');
      return;
    }

    // If truck is pending approval but not yet approved, prevent verification
    if (truck.status === 'pending-approval' && truck.approvalStatus !== 'approved') {
      setError('This truck requires approval before it can be verified');
      return;
    }

    if (status === 'verified') {
      // Show location selection modal for verified trucks
      setShowLocationModal(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the truck status in Firestore
      await updateTruckStatus(truck.id, status, verificationData);
      
      // Create audit entry
      await createAuditEntry(truck, 'REJECTED', {
        status: status,
        notes: verificationData.notes,
        failedChecks: verificationData.failedChecks
      }, user);
      
      onVerificationComplete();
    } catch (err) {
      console.error('Error updating truck status:', err);
      setError('Failed to update truck status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLocationAssignment = async () => {
    if (!user || !selectedLocation) {
      setError('Please select a location for the truck');
      return;
    }

    if (selectedLocation === 'weighbridge' && !selectedWeighbridge) {
      setError('Please select a weighbridge');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // For approved trucks, include the approval reference in notes
      if (truck.status === 'pending-approval' && truck.approvalStatus === 'approved' && !verificationData.notes.includes('[Approved with notes:')) {
        verificationData.notes = `[Approved by authority] ${verificationData.notes}`;
      }
      
      // First update truck status to verified
      await updateTruckStatus(truck.id, 'verified', verificationData);
      
      // Create audit entry for verification
      await createAuditEntry(truck, 'VERIFIED', {
        status: 'verified',
        notes: verificationData.notes
      }, user);
      
      // Then assign location and weighbridge if selected
      const updateData: any = {
        location: selectedLocation,
        assignedBy: user.uid,
        notes: locationNotes,
        status: selectedLocation === 'weighbridge' ? 'at_weighbridge' : 'at_' + selectedLocation
      };

      let weighbridgeEntryId: string | undefined;

      if (selectedLocation === 'weighbridge') {
        updateData.weighbridgeId = selectedWeighbridge;
        updateData.source = 'gate';
        
        // Get weighbridge name for audit
        const selectedWeighbridgeObj = weighbridges.find(wb => wb.id === selectedWeighbridge);
        if (selectedWeighbridgeObj) {
          updateData.weighbridgeName = selectedWeighbridgeObj.name;
        }
        
        // Create a new weighbridge entry
        const weighbridgeEntry = {
          truckNumber: truck.vehicleNumber,
          transporterName: truck.transporterName,
          status: 'PENDING_WEIGHING',
          inTime: Timestamp.now(),
          currentMilestone: 'PENDING_WEIGHING',
          truckId: truck.id,
          createdAt: Timestamp.now(),
          createdBy: user.uid
        };
        
        const weighbridgeEntryRef = await addDoc(collection(db, 'weighbridgeEntries'), weighbridgeEntry);
        weighbridgeEntryId = weighbridgeEntryRef.id;
        updateData.weighbridgeEntryId = weighbridgeEntryId;
      }

      // Update the truck document
      const truckRef = doc(db, 'trucks', truck.id);
      await updateDoc(truckRef, updateData);
      
      // Create or update entry in plantTracking collection
      const plantTrackingData = {
        truckNumber: truck.vehicleNumber,
        transporterName: truck.transporterName,
        driverName: truck.driverName,
        mobileNumber: truck.mobileNumber,
        status: updateData.status.toUpperCase(), // Convert to uppercase for LED screen
        location: selectedLocation,
        lastUpdated: Timestamp.now(),
        updatedBy: user.uid,
        truckId: truck.id,
        notes: locationNotes || '',
        weighbridgeId: selectedLocation === 'weighbridge' ? selectedWeighbridge : null,
        weighbridgeEntryId: weighbridgeEntryId || null,
        dockName: null // Will be updated when assigned to a dock
      };

      // Check if an entry already exists
      const plantTrackingQuery = query(
        collection(db, 'plantTracking'),
        where('truckNumber', '==', truck.vehicleNumber),
        where('status', '!=', 'EXITED')
      );
      
      const plantTrackingSnapshot = await getDocs(plantTrackingQuery);
      
      if (plantTrackingSnapshot.empty) {
        // Create new entry
        await addDoc(collection(db, 'plantTracking'), {
          ...plantTrackingData,
          createdAt: Timestamp.now()
        });
      } else {
        // Update existing entry
        await updateDoc(plantTrackingSnapshot.docs[0].ref, plantTrackingData);
      }
      
      // Create audit entry for location assignment
      const actionType = selectedLocation === 'weighbridge' 
        ? 'ASSIGNED_TO_WEIGHBRIDGE' 
        : `ASSIGNED_TO_${selectedLocation.toUpperCase()}`;
      
      await createAuditEntry(truck, actionType, {
        location: selectedLocation,
        notes: locationNotes,
        status: updateData.status,
        weighbridgeId: updateData.weighbridgeId,
        weighbridgeName: updateData.weighbridgeName,
        weighbridgeEntryId: updateData.weighbridgeEntryId
      }, user);
      
      setShowLocationModal(false);
      onVerificationComplete();
    } catch (err) {
      console.error('Error verifying truck and assigning location:', err);
      setError('Failed to verify truck and assign location');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendForApproval = async () => {
    if (!user) {
      setError('You must be logged in to send a truck for approval');
      return;
    }
    
    if (verificationData.failedChecks.length === 0) {
      setError('Please select at least one failed check that requires approval');
      return;
    }
    
    if (!verificationData.approvalReason.trim()) {
      setError('Please provide a reason for the approval request');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await sendTruckForApproval(
        truck.id,
        user.uid,
        verificationData.failedChecks,
        verificationData.approvalReason,
        verificationData
      );
      
      // Create audit entry
      await createAuditEntry(truck, 'SENT_FOR_APPROVAL', {
        status: 'pending-approval',
        failedChecks: verificationData.failedChecks,
        approvalReason: verificationData.approvalReason
      }, user);
      
      onVerificationComplete();
    } catch (err) {
      console.error('Error sending truck for approval:', err);
      setError('Failed to send truck for approval');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFailedCheck = (check: string) => {
    setVerificationData(prev => {
      const failedChecks = [...prev.failedChecks];
      const index = failedChecks.indexOf(check);
      
      if (index === -1) {
        failedChecks.push(check);
      } else {
        failedChecks.splice(index, 1);
      }
      
      return {
        ...prev,
        failedChecks
      };
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
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

  const isValidDate = (date: string | undefined) => {
    if (!date) return false;
    const today = new Date();
    const validityDate = new Date(date);
    return validityDate > today;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Verify Truck
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Pending Approval Notice */}
            {truck.status === 'pending-approval' && truck.approvalStatus === 'pending' && (
              <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h3 className="text-lg font-medium text-orange-800 dark:text-orange-400 mb-2">Pending Approval</h3>
                <p className="text-orange-700 dark:text-orange-500 mb-4">This truck requires approval due to failed checks.</p>
                
                {truck.failedChecks && truck.failedChecks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Failed Checks:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {truck.failedChecks.includes('driverIdentity') && (
                        <li>Driver Identity Verification</li>
                      )}
                      {truck.failedChecks.includes('vehicleNumber') && (
                        <li>Vehicle Number Verification</li>
                      )}
                      {truck.failedChecks.includes('documents') && (
                        <li>Required Documents</li>
                      )}
                      {truck.failedChecks.includes('dlValidity') && (
                        <li>Driver License Expired</li>
                      )}
                      {truck.failedChecks.includes('rcValidity') && (
                        <li>RC Expired</li>
                      )}
                      {truck.failedChecks.includes('insuranceValidity') && (
                        <li>Insurance Expired</li>
                      )}
                      {truck.failedChecks.includes('pollutionValidity') && (
                        <li>Pollution Certificate Expired</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {truck.approvalNotes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-1">Approval Notes:</h4>
                    <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-orange-200 dark:border-orange-800">
                      {truck.approvalNotes}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Requested on: {truck.approvalRequestedAt ? new Date(truck.approvalRequestedAt).toLocaleString() : 'Unknown'}
                </p>
              </div>
            )}

            {/* Approved Notice */}
            {truck.status === 'pending-approval' && truck.approvalStatus === 'approved' && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-400 mb-2">Approval Granted</h3>
                <p className="text-green-700 dark:text-green-500 mb-4">
                  This truck has been approved. You may now verify the truck for entry.
                </p>
                
                {truck.approvalNotes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-1">Approval Notes:</h4>
                    <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800">
                      {truck.approvalNotes}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col text-xs text-green-600 dark:text-green-400">
                  <p>Approved on: {truck.approvalResolvedAt ? new Date(truck.approvalResolvedAt).toLocaleString() : 'Unknown'}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800 mb-6">
              <button
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                  activeTab === 'basic'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
                {activeTab === 'basic' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
              <button
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                  activeTab === 'documents'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
                {activeTab === 'documents' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
              <button
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                  activeTab === 'compliance'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('compliance')}
              >
                Compliance
                {activeTab === 'compliance' && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Truck Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Truck Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Number</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{truck.vehicleNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gate</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{truck.gate}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled for</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(truck.reportingDate)} at {formatTime(truck.reportingTime)}
                      </span>
                    </div>
                    {truck.loadingCapacity && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading Capacity</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{truck.loadingCapacity}</span>
                      </div>
                    )}
                    {truck.rtoPassingCapacity && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">RTO Passing Capacity</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{truck.rtoPassingCapacity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Driver Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{truck.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">License</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{truck.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{truck.mobileNumber}</span>
                    </div>
                    {truck.dlValidityDate && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">License Valid Until</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(truck.dlValidityDate)}</span>
                          {!isValidDate(truck.dlValidityDate) && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transporter Details Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm md:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transporter Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Transporter Name</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{truck.transporterName}</span>
                      </div>
                      {truck.depotName && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Depot Name</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{truck.depotName}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {truck.supplierName && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier Name</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{truck.supplierName}</span>
                        </div>
                      )}
                      {truck.lrNumber && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">LR Number</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{truck.lrNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="mb-6 space-y-6">
                {/* RC and Insurance Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vehicle Documents</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RC Details */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">RC Details</span>
                          {!isValidDate(truck.rcValidityDate) && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Number</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {truck.rcNumber || 'N/A'}
                            </span>
                          </div>
                          {truck.rcValidityDate && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Valid Until</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(truck.rcValidityDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Insurance Details */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Insurance Details</span>
                          {!isValidDate(truck.insuranceValidityDate) && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                              EXPIRED
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Number</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {truck.insuranceNumber || 'N/A'}
                            </span>
                          </div>
                          {truck.insuranceValidityDate && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Valid Until</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(truck.insuranceValidityDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pollution Certificate Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pollution Certificate</h3>
                    {!isValidDate(truck.pollutionValidityDate) && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                        EXPIRED
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Certificate Number</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {truck.pollutionNumber || 'N/A'}
                        </span>
                      </div>
                      {truck.pollutionValidityDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Valid Until</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {formatDate(truck.pollutionValidityDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="mb-6 space-y-4">
                <h3 className="text-lg font-medium mb-3">Verification Checklist</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="driverIdentity"
                      checked={verificationData.driverIdentityVerified}
                      onChange={(e) => handleVerificationChange('driverIdentityVerified', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label htmlFor="driverIdentity" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Driver Identity Verified <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vehicleNumber"
                      checked={verificationData.vehicleNumberVerified}
                      onChange={(e) => handleVerificationChange('vehicleNumberVerified', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label htmlFor="vehicleNumber" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vehicle Number Matches <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="documents"
                      checked={verificationData.documentsVerified}
                      onChange={(e) => handleVerificationChange('documentsVerified', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label htmlFor="documents" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Documents Verified <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="safetyEquipment"
                      checked={verificationData.safetyEquipmentChecked}
                      onChange={(e) => handleVerificationChange('safetyEquipmentChecked', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label htmlFor="safetyEquipment" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Safety Equipment Checked
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="vehicleCondition"
                      checked={verificationData.vehicleConditionChecked}
                      onChange={(e) => handleVerificationChange('vehicleConditionChecked', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <label htmlFor="vehicleCondition" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vehicle Condition Checked
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="text-red-500">*</span> Required for approval
                </p>

                <div className="mt-4">
                  <label htmlFor="notes" className="block text-sm font-medium mb-2">
                    Notes / Comments
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={verificationData.notes}
                    onChange={(e) => handleVerificationChange('notes', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                    placeholder="Add any additional notes about the verification..."
                  />
                </div>
              </div>
            )}

            {showApprovalForm ? (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-400 mb-4">Send for Approval</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 font-medium text-sm">Select checks that failed and require approval:</p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="failedDriverIdentity"
                          checked={verificationData.failedChecks.includes('driverIdentity')}
                          onChange={() => toggleFailedCheck('driverIdentity')}
                          className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <label htmlFor="failedDriverIdentity" className="ml-2 text-sm">
                          Driver Identity
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="failedVehicleNumber"
                          checked={verificationData.failedChecks.includes('vehicleNumber')}
                          onChange={() => toggleFailedCheck('vehicleNumber')}
                          className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <label htmlFor="failedVehicleNumber" className="ml-2 text-sm">
                          Vehicle Number
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="failedDocuments"
                          checked={verificationData.failedChecks.includes('documents')}
                          onChange={() => toggleFailedCheck('documents')}
                          className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <label htmlFor="failedDocuments" className="ml-2 text-sm">
                          Required Documents
                        </label>
                      </div>
                      
                      {!isValidDate(truck.dlValidityDate) && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="failedDLValidity"
                            checked={verificationData.failedChecks.includes('dlValidity')}
                            onChange={() => toggleFailedCheck('dlValidity')}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <label htmlFor="failedDLValidity" className="ml-2 text-sm">
                            Driver License Expired
                          </label>
                        </div>
                      )}
                      
                      {!isValidDate(truck.rcValidityDate) && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="failedRCValidity"
                            checked={verificationData.failedChecks.includes('rcValidity')}
                            onChange={() => toggleFailedCheck('rcValidity')}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <label htmlFor="failedRCValidity" className="ml-2 text-sm">
                            RC Expired
                          </label>
                        </div>
                      )}
                      
                      {!isValidDate(truck.insuranceValidityDate) && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="failedInsuranceValidity"
                            checked={verificationData.failedChecks.includes('insuranceValidity')}
                            onChange={() => toggleFailedCheck('insuranceValidity')}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <label htmlFor="failedInsuranceValidity" className="ml-2 text-sm">
                            Insurance Expired
                          </label>
                        </div>
                      )}
                      
                      {!isValidDate(truck.pollutionValidityDate) && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="failedPollutionValidity"
                            checked={verificationData.failedChecks.includes('pollutionValidity')}
                            onChange={() => toggleFailedCheck('pollutionValidity')}
                            className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <label htmlFor="failedPollutionValidity" className="ml-2 text-sm">
                            Pollution Certificate Expired
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="approvalReason" className="block text-sm font-medium mb-2">
                      Reason for Approval Request <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="approvalReason"
                      rows={3}
                      value={verificationData.approvalReason}
                      onChange={(e) => handleVerificationChange('approvalReason', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-900"
                      placeholder="Explain why this truck requires approval despite failing some checks..."
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowApprovalForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendForApproval}
                    disabled={loading || verificationData.failedChecks.length === 0 || !verificationData.approvalReason.trim()}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                      loading || verificationData.failedChecks.length === 0 || !verificationData.approvalReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Sending...' : 'Send for Approval'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  {truck.status !== 'pending-approval' || (truck.status === 'pending-approval' && truck.approvalStatus !== 'approved') ? (
                    <button
                      onClick={() => setShowApprovalForm(true)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Send for Approval
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleVerify('rejected')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify('verified')}
                    disabled={!isFormValid() || loading || (truck.status === 'pending-approval' && truck.approvalStatus !== 'approved')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 
                      ${!isFormValid() || loading || (truck.status === 'pending-approval' && truck.approvalStatus !== 'approved')
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                      }`}
                  >
                    {loading ? 'Verifying...' : truck.status === 'pending-approval' && truck.approvalStatus === 'approved' ? 'Verify with Exception' : 'Verify'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md m-4 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Assign Location
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                >
                  <option value="">Select a location...</option>
                  <option value="parking">Parking</option>
                  <option value="weighbridge">Weighbridge</option>
                  <option value="loading">Loading Bay</option>
                  <option value="unloading">Unloading Bay</option>
                </select>
              </div>

              {selectedLocation === 'weighbridge' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Weighbridge
                  </label>
                  <select
                    value={selectedWeighbridge}
                    onChange={(e) => setSelectedWeighbridge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                  >
                    <option value="">Select a weighbridge...</option>
                    {weighbridges
                      .filter(wb => wb.isActive)
                      .map(wb => (
                        <option key={wb.id} value={wb.id}>
                          {wb.name} - {wb.location}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-200"
                  rows={3}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationAssignment}
                disabled={loading || !selectedLocation || (selectedLocation === 'weighbridge' && !selectedWeighbridge)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 
                  ${loading || !selectedLocation || (selectedLocation === 'weighbridge' && !selectedWeighbridge)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  }`}
              >
                {loading ? 'Assigning...' : 'Assign Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 