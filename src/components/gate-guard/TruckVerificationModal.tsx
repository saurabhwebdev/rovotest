'use client';

import { useState, useEffect } from 'react';
import { updateTruckStatus, sendTruckForApproval, updateTruckLocation } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
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
        updateData.weighbridgeEntryId = weighbridgeEntryRef.id;
      }

      const truckRef = doc(db, 'trucks', truck.id);
      await updateDoc(truckRef, updateData);
      
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Verify Truck</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
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
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === 'compliance'
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('compliance')}
            >
              Compliance
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'basic' && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Truck Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Vehicle Number:</span> {truck.vehicleNumber}</p>
                  <p><span className="font-medium">Gate:</span> {truck.gate}</p>
                  <p><span className="font-medium">Scheduled for:</span> {formatDate(truck.reportingDate)} at {formatTime(truck.reportingTime)}</p>
                  {truck.loadingCapacity && (
                    <p><span className="font-medium">Loading Capacity:</span> {truck.loadingCapacity}</p>
                  )}
                  {truck.rtoPassingCapacity && (
                    <p><span className="font-medium">RTO Passing Capacity:</span> {truck.rtoPassingCapacity}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Driver Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {truck.driverName}</p>
                  <p><span className="font-medium">License:</span> {truck.licenseNumber}</p>
                  <p><span className="font-medium">Contact:</span> {truck.mobileNumber}</p>
                  {truck.dlValidityDate && (
                    <p>
                      <span className="font-medium">License Valid Until:</span> {formatDate(truck.dlValidityDate)}
                      {!isValidDate(truck.dlValidityDate) && (
                        <span className="ml-2 text-red-500 text-xs font-medium">EXPIRED</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Transporter Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Transporter Name:</span> {truck.transporterName}</p>
                  {truck.depotName && (
                    <p><span className="font-medium">Depot Name:</span> {truck.depotName}</p>
                  )}
                  {truck.supplierName && (
                    <p><span className="font-medium">Supplier Name:</span> {truck.supplierName}</p>
                  )}
                  {truck.lrNumber && (
                    <p><span className="font-medium">LR Number:</span> {truck.lrNumber}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-medium mb-2">Document Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm border-b pb-4 md:border-b-0 md:border-r md:pr-4 dark:border-gray-700">
                  <p>
                    <span className="font-medium">RC Number:</span> {truck.rcNumber || 'N/A'}
                    {truck.rcValidityDate && (
                      <span className="block mt-1">
                        Valid until: {formatDate(truck.rcValidityDate)}
                        {!isValidDate(truck.rcValidityDate) && (
                          <span className="ml-2 text-red-500 text-xs font-medium">EXPIRED</span>
                        )}
                      </span>
                    )}
                  </p>
                  <p className="pt-2">
                    <span className="font-medium">Insurance Number:</span> {truck.insuranceNumber || 'N/A'}
                    {truck.insuranceValidityDate && (
                      <span className="block mt-1">
                        Valid until: {formatDate(truck.insuranceValidityDate)}
                        {!isValidDate(truck.insuranceValidityDate) && (
                          <span className="ml-2 text-red-500 text-xs font-medium">EXPIRED</span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-2 text-sm pt-4 md:pt-0">
                  <p>
                    <span className="font-medium">Pollution Certificate:</span> {truck.pollutionNumber || 'N/A'}
                    {truck.pollutionValidityDate && (
                      <span className="block mt-1">
                        Valid until: {formatDate(truck.pollutionValidityDate)}
                        {!isValidDate(truck.pollutionValidityDate) && (
                          <span className="ml-2 text-red-500 text-xs font-medium">EXPIRED</span>
                        )}
                      </span>
                    )}
                  </p>
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
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="driverIdentity" className="ml-2 text-sm font-medium">
                    Driver Identity Verified <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="vehicleNumber"
                    checked={verificationData.vehicleNumberVerified}
                    onChange={(e) => handleVerificationChange('vehicleNumberVerified', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="vehicleNumber" className="ml-2 text-sm font-medium">
                    Vehicle Number Matches <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="documents"
                    checked={verificationData.documentsVerified}
                    onChange={(e) => handleVerificationChange('documentsVerified', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="documents" className="ml-2 text-sm font-medium">
                    Required Documents Verified <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="safetyEquipment"
                    checked={verificationData.safetyEquipmentChecked}
                    onChange={(e) => handleVerificationChange('safetyEquipmentChecked', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="safetyEquipment" className="ml-2 text-sm font-medium">
                    Safety Equipment Checked
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="vehicleCondition"
                    checked={verificationData.vehicleConditionChecked}
                    onChange={(e) => handleVerificationChange('vehicleConditionChecked', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="vehicleCondition" className="ml-2 text-sm font-medium">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900"
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
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    !isFormValid() || loading || (truck.status === 'pending-approval' && truck.approvalStatus !== 'approved') ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Verifying...' : truck.status === 'pending-approval' && truck.approvalStatus === 'approved' ? 'Verify with Exception' : 'Verify'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Location</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
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
                  <label className="block text-sm font-medium mb-1">
                    Select Weighbridge
                  </label>
                  <select
                    value={selectedWeighbridge}
                    onChange={(e) => setSelectedWeighbridge(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
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
                <label className="block text-sm font-medium mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                         hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 
                         dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationAssignment}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
                         hover:bg-blue-600 rounded-md disabled:opacity-50 
                         disabled:cursor-not-allowed"
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