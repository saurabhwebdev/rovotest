'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addDocument, getDocument, updateDocument } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

interface TruckSchedulingFormData {
  driverName: string;
  mobileNumber: string;
  licenseNumber: string;
  vehicleNumber: string;
  depotName: string;
  lrNumber: string;
  rtoPassingCapacity: string;
  loadingCapacity: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  gate: string;
  supplierName: string;
  rcNumber: string;
  insuranceNumber: string;
  pollutionNumber: string;
  dlValidityDate: string;
  rcValidityDate: string;
  insuranceValidityDate: string;
  pollutionValidityDate: string;
}

interface TruckSchedulingFormProps {
  onSuccess?: () => void;
}

export default function TruckSchedulingForm({ onSuccess }: TruckSchedulingFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Master data states
  const [transporters, setTransporters] = useState<MasterDataItem[]>([]);
  const [depots, setDepots] = useState<MasterDataItem[]>([]);
  const [suppliers, setSuppliers] = useState<MasterDataItem[]>([]);
  const [gates, setGates] = useState<MasterDataItem[]>([]);
  
  const [formData, setFormData] = useState<TruckSchedulingFormData>({
    driverName: '',
    mobileNumber: '',
    licenseNumber: '',
    vehicleNumber: '',
    depotName: '',
    lrNumber: '',
    rtoPassingCapacity: '',
    loadingCapacity: '',
    transporterName: '',
    reportingDate: '',
    reportingTime: '',
    gate: '',
    supplierName: '',
    rcNumber: '',
    insuranceNumber: '',
    pollutionNumber: '',
    dlValidityDate: '',
    rcValidityDate: '',
    insuranceValidityDate: '',
    pollutionValidityDate: ''
  });

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = () => {
      // Fetch transporters
      const transportersQuery = query(collection(db, 'transporters'));
      const transportersUnsubscribe = onSnapshot(transportersQuery, (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.isActive)
          .sort((a: any, b: any) => a.name.localeCompare(b.name)) as MasterDataItem[];
        setTransporters(data);
      });

      // Fetch depots
      const depotsQuery = query(collection(db, 'depots'));
      const depotsUnsubscribe = onSnapshot(depotsQuery, (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.isActive)
          .sort((a: any, b: any) => a.name.localeCompare(b.name)) as MasterDataItem[];
        setDepots(data);
      });

      // Fetch suppliers
      const suppliersQuery = query(collection(db, 'suppliers'));
      const suppliersUnsubscribe = onSnapshot(suppliersQuery, (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.isActive)
          .sort((a: any, b: any) => a.name.localeCompare(b.name)) as MasterDataItem[];
        setSuppliers(data);
      });

      // Fetch gates
      const gatesQuery = query(collection(db, 'gates'));
      const gatesUnsubscribe = onSnapshot(gatesQuery, (snapshot) => {
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.isActive)
          .sort((a: any, b: any) => a.name.localeCompare(b.name)) as MasterDataItem[];
        setGates(data);
      });

      return () => {
        transportersUnsubscribe();
        depotsUnsubscribe();
        suppliersUnsubscribe();
        gatesUnsubscribe();
      };
    };

    return fetchMasterData();
  }, []);

  // Check for edit mode on component mount
  useEffect(() => {
    const checkForEditMode = async () => {
      if (typeof window !== 'undefined') {
        const storedEditId = localStorage.getItem('editTruckId');
        if (storedEditId) {
          setIsEditing(true);
          setEditId(storedEditId);
          
          try {
            setLoading(true);
            const truckData: any = await getDocument('trucks', storedEditId);
            if (truckData) {
              // Filter out non-form fields
              const { id, createdAt, updatedAt, userId, status, ...formFields } = truckData;
              setFormData(formFields as TruckSchedulingFormData);
            }
          } catch (err) {
            console.error('Error fetching truck data:', err);
            setError('Failed to load truck data for editing');
          } finally {
            setLoading(false);
            // Clear the stored ID after loading
            localStorage.removeItem('editTruckId');
          }
        }
      }
    };
    
    checkForEditMode();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearAll = () => {
    // Reset form data to initial empty state
    setFormData({
      driverName: '',
      mobileNumber: '',
      licenseNumber: '',
      vehicleNumber: '',
      depotName: '',
      lrNumber: '',
      rtoPassingCapacity: '',
      loadingCapacity: '',
      transporterName: '',
      reportingDate: '',
      reportingTime: '',
      gate: '',
      supplierName: '',
      rcNumber: '',
      insuranceNumber: '',
      pollutionNumber: '',
      dlValidityDate: '',
      rcValidityDate: '',
      insuranceValidityDate: '',
      pollutionValidityDate: ''
    });
    // Clear any error messages
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to schedule a truck');
      }

      // Prepare truck data
      let truckData: any = {
        ...formData,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };
      
      let truckId: string;
      const currentTime = new Date().toISOString();
      
      if (isEditing && editId) {
        // Update existing truck
        await updateDocument('trucks', editId, truckData);
        truckId = editId;
        
        // Create audit trail entry for update
        await addDocument('truckSchedulingAudit', {
          truckId: truckId,
          vehicleNumber: formData.vehicleNumber,
          action: 'Updated',
          timestamp: currentTime,
          userId: user.uid,
          userName: user.displayName || user.email || 'Unknown User',
          details: {
            updatedFields: formData
          }
        });
      } else {
        // Create new truck
        truckData.status = 'scheduled';
        truckData.createdAt = currentTime;
        truckId = await addDocument('trucks', truckData);
        
        // Create audit trail entry for new schedule
        await addDocument('truckSchedulingAudit', {
          truckId: truckId,
          vehicleNumber: formData.vehicleNumber,
          action: 'Scheduled',
          timestamp: currentTime,
          userId: user.uid,
          userName: user.displayName || user.email || 'Unknown User',
          details: {
            scheduledData: formData
          }
        });
      }
      
      // Generate QR code data
      const qrData = JSON.stringify({
        id: truckId,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        reportingDate: formData.reportingDate,
        reportingTime: formData.reportingTime
      });
      
      setQrCodeData(qrData);
      setSuccess(true);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        // Add a small delay to allow the user to see the success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
      
      // Reset form after successful submission if not in edit mode
      if (!isEditing) {
        setFormData({
          driverName: '',
          mobileNumber: '',
          licenseNumber: '',
          vehicleNumber: '',
          depotName: '',
          lrNumber: '',
          rtoPassingCapacity: '',
          loadingCapacity: '',
          transporterName: '',
          reportingDate: '',
          reportingTime: '',
          gate: '',
          supplierName: '',
          rcNumber: '',
          insuranceNumber: '',
          pollutionNumber: '',
          dlValidityDate: '',
          rcValidityDate: '',
          insuranceValidityDate: '',
          pollutionValidityDate: ''
        });
      }
    } catch (err) {
      console.error('Error scheduling truck:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule truck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="mb-6 p-4 sm:p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-400 mb-2">{isEditing ? 'Truck Updated Successfully' : 'Truck Scheduled Successfully'}</h3>
          <p className="text-green-700 dark:text-green-500 mb-4 sm:mb-6">{isEditing ? 'Your truck details have been updated. Below is your QR code for easy check-in.' : 'Your truck has been scheduled. Below is your QR code for easy check-in.'}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
              <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Truck Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Vehicle Number:</span>
                  <span>{formData.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Driver Name:</span>
                  <span>{formData.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Transporter:</span>
                  <span>{formData.transporterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reporting Date:</span>
                  <span>{formData.reportingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reporting Time:</span>
                  <span>{formData.reportingTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Gate:</span>
                  <span>{formData.gate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    scheduled
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 rounded-lg">
              <QRCodeSVG value={qrCodeData} size={180} className="success-qr-code" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Scan this QR code at the gate for quick check-in
              </p>
              <button 
                onClick={() => {
                  // Get the SVG element
                  const svgElement = document.querySelector(".success-qr-code");
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
                      downloadLink.download = `truck-qr-${formData.vehicleNumber || new Date().getTime()}.png`;
                      document.body.appendChild(downloadLink);
                      downloadLink.click();
                      document.body.removeChild(downloadLink);
                    };
                    
                    img.src = url;
                  }
                }}
                className="mt-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Code
              </button>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 flex justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm sm:text-base"
            >
              Schedule Another Truck
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-4 sm:mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transporter Name*
                </label>
                <select
                  name="transporterName"
                  value={formData.transporterName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select Transporter</option>
                  {transporters.map(transporter => (
                    <option key={transporter.id} value={transporter.name}>
                      {transporter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Depot Name*
                </label>
                <select
                  name="depotName"
                  value={formData.depotName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select Depot</option>
                  {depots.map(depot => (
                    <option key={depot.id} value={depot.name}>
                      {depot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier Name*
                </label>
                <select
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gate*
                </label>
                <select
                  name="gate"
                  value={formData.gate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                           dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select Gate</option>
                  {gates.map(gate => (
                    <option key={gate.id} value={gate.name}>
                      {gate.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Driver Information Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white">Driver Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Driver Name*
                </label>
                <Input
                  type="text"
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mobile Number*
                </label>
                <Input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  License Number*
                </label>
                <Input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="dlValidityDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  DL Validity Date*
                </label>
                <Input
                  type="date"
                  id="dlValidityDate"
                  name="dlValidityDate"
                  value={formData.dlValidityDate}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Vehicle Information Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Number*
                </label>
                <Input
                  type="text"
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="rcNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  RC Number*
                </label>
                <Input
                  type="text"
                  id="rcNumber"
                  name="rcNumber"
                  value={formData.rcNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="rcValidityDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  RC Validity Date*
                </label>
                <Input
                  type="date"
                  id="rcValidityDate"
                  name="rcValidityDate"
                  value={formData.rcValidityDate}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="rtoPassingCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  RTO Passing Capacity (Tonnes)*
                </label>
                <Input
                  type="text"
                  id="rtoPassingCapacity"
                  name="rtoPassingCapacity"
                  value={formData.rtoPassingCapacity}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="loadingCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loading Capacity*
                </label>
                <Input
                  type="text"
                  id="loadingCapacity"
                  name="loadingCapacity"
                  value={formData.loadingCapacity}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Compliance Information Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white">Compliance Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Number*
                </label>
                <Input
                  type="text"
                  id="insuranceNumber"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="insuranceValidityDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Validity Date*
                </label>
                <Input
                  type="date"
                  id="insuranceValidityDate"
                  name="insuranceValidityDate"
                  value={formData.insuranceValidityDate}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="pollutionNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Number*
                </label>
                <Input
                  type="text"
                  id="pollutionNumber"
                  name="pollutionNumber"
                  value={formData.pollutionNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="pollutionValidityDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Validity Date*
                </label>
                <Input
                  type="date"
                  id="pollutionValidityDate"
                  name="pollutionValidityDate"
                  value={formData.pollutionValidityDate}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Scheduling Information Section */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold dark:text-white">Scheduling Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lrNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  LR Number*
                </label>
                <Input
                  type="text"
                  id="lrNumber"
                  name="lrNumber"
                  value={formData.lrNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label htmlFor="reportingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reporting Date*
                  </label>
                  <Input
                    type="date"
                    id="reportingDate"
                    name="reportingDate"
                    value={formData.reportingDate}
                    onChange={handleChange}
                    required
                    className="mt-1 text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="reportingTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reporting Time*
                  </label>
                  <Input
                    type="time"
                    id="reportingTime"
                    name="reportingTime"
                    value={formData.reportingTime}
                    onChange={handleChange}
                    required
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center justify-center py-2 px-4 sm:px-6 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center py-2 px-4 sm:px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isEditing ? 'Update Truck' : 'Schedule Truck'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}