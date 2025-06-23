'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface WeighbridgeEntry {
  id: string;
  truckNumber: string;
  transporterName: string;
  status: string;
  inTime: Timestamp;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weighingTime?: Timestamp;
  currentMilestone: 'PENDING_WEIGHING' | 'WEIGHED' | 'AT_PARKING' | 'AT_DOCK';
}

interface WeightDetails {
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  orderNumber: string;
  materialType: string;
}

interface WeighingModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WeighbridgeEntry;
  onWeighingComplete?: (weightDetails: WeightDetails) => void;
}

export default function WeighingModal({ isOpen, onClose, entry, onWeighingComplete }: WeighingModalProps) {
  const { user } = useAuth();
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [materialType, setMaterialType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const netWeight = grossWeight - tareWeight;
      const needsApproval = Math.abs(netWeight) > 200;
      
      // Prepare weight details for audit
      const weightDetails: WeightDetails = {
        grossWeight,
        tareWeight,
        netWeight,
        orderNumber,
        materialType
      };
      
      if (needsApproval) {
        // Create an approval request
        const approvalRequest = {
          type: 'WEIGHMENT',
          status: 'PENDING',
          createdAt: Timestamp.now(),
          createdBy: user?.uid,
          data: {
            weighbridgeEntryId: entry.id,
            truckNumber: entry.truckNumber,
            transporterName: entry.transporterName,
            grossWeight,
            tareWeight,
            netWeight,
            orderNumber,
            materialType
          }
        };
        
        await addDoc(collection(db, 'approvalRequests'), approvalRequest);
        
        // Update weighbridge entry status to pending approval
        await updateDoc(doc(db, 'weighbridgeEntries', entry.id), {
          status: 'PENDING_APPROVAL',
          currentMilestone: 'PENDING_WEIGHING',
          approvalRequestedAt: Timestamp.now()
        });
      } else {
        // Direct approval for normal weight differences
        await updateDoc(doc(db, 'weighbridgeEntries', entry.id), {
          grossWeight,
          tareWeight,
          netWeight,
          orderNumber,
          materialType,
          weighingTime: Timestamp.now(),
          status: 'WEIGHED',
          currentMilestone: 'WEIGHED'
        });
      }

      // Call the callback if provided
      if (onWeighingComplete) {
        onWeighingComplete(weightDetails);
      }

      onClose();
    } catch (error) {
      console.error('Error updating weight:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Weigh Truck: {entry.truckNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Transporter</p>
              <p className="font-medium text-gray-900 dark:text-white">{entry.transporterName}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">In Time</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {entry.inTime.toDate().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                required
                placeholder="Enter order #"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Material Type
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                required
              >
                <option value="">Select material</option>
                <option value="raw">Raw Material</option>
                <option value="finished">Finished Goods</option>
                <option value="packaging">Packaging Material</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gross Weight (kg)
              </label>
              <input
                type="number"
                value={grossWeight}
                onChange={(e) => setGrossWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                required
                min="0"
                placeholder="Enter gross weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tare Weight (kg)
              </label>
              <input
                type="number"
                value={tareWeight}
                onChange={(e) => setTareWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                required
                min="0"
                placeholder="Enter tare weight"
              />
            </div>
          </div>

          {grossWeight > 0 && tareWeight > 0 && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Net Weight</span>
                <span className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                  {grossWeight - tareWeight} kg
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || grossWeight <= 0 || tareWeight <= 0 || !orderNumber || !materialType}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              {loading ? 'Saving...' : 'Save Weight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 