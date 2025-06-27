'use client';

import { useState, useEffect } from 'react';
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  dockId?: string;
  dockName?: string;
}

interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
  isActive: boolean;
  capacity: number;
  location: string;
  isFree?: boolean;
}

interface NextMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WeighbridgeEntry;
  docks: Dock[];
  onMoveToPark: (entry: WeighbridgeEntry) => Promise<void>;
  onMoveToDock: (entry: WeighbridgeEntry, dockId: string) => Promise<void>;
}

export default function NextMilestoneModal({
  isOpen,
  onClose,
  entry,
  docks,
  onMoveToPark,
  onMoveToDock
}: NextMilestoneModalProps) {
  const [selectedDockId, setSelectedDockId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'parking' | 'dock'>(
    entry.currentMilestone === 'WEIGHED' ? 'parking' : 'dock'
  );
  const [loading, setLoading] = useState(false);
  const [availableDocks, setAvailableDocks] = useState<Dock[]>([]);
  const [checkingDocks, setCheckingDocks] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkDockAvailability();
    }
  }, [isOpen, docks]);

  const checkDockAvailability = async () => {
    try {
      setCheckingDocks(true);
      
      // Get active dock operations
      const activeOpsQuery = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'IN_PROGRESS')
      );
      const activeOpsSnapshot = await getDocs(activeOpsQuery);
      
      // Create set of occupied dock IDs
      const occupiedDockIds = new Set();
      activeOpsSnapshot.forEach(doc => {
        const data = doc.data();
        occupiedDockIds.add(data.dockId);
      });
      
      // Filter docks to only include active and free docks
      const freeDocks = docks
        .filter(dock => dock.isActive && !occupiedDockIds.has(dock.id))
        .map(dock => ({...dock, isFree: true}));
      
      // Sort by name
      const sortedFreeDocks = [...freeDocks].sort((a, b) => a.name.localeCompare(b.name));
      
      setAvailableDocks(sortedFreeDocks);
    } catch (error) {
      console.error('Error checking dock availability:', error);
    } finally {
      setCheckingDocks(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedAction === 'parking') {
        await onMoveToPark(entry);
      } else if (selectedAction === 'dock' && selectedDockId) {
        await onMoveToDock(entry, selectedDockId);
      }
      onClose();
    } catch (error) {
      console.error('Error updating truck milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Next Action for Truck: {entry.truckNumber}
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
              <p className="text-gray-500 dark:text-gray-400">Current Milestone</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {entry.currentMilestone.replace('_', ' ')}
              </p>
            </div>
            {entry.grossWeight && (
              <>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Gross Weight</p>
                  <p className="font-medium text-gray-900 dark:text-white">{entry.grossWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Net Weight</p>
                  <p className="font-medium text-gray-900 dark:text-white">{entry.netWeight} kg</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Next Action
              </label>
              <div className="flex space-x-4">
                {entry.currentMilestone === 'WEIGHED' && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="action"
                      value="parking"
                      checked={selectedAction === 'parking'}
                      onChange={() => setSelectedAction('parking')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Move to Parking</span>
                  </label>
                )}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="dock"
                    checked={selectedAction === 'dock'}
                    onChange={() => setSelectedAction('dock')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Assign to Dock</span>
                </label>
              </div>
            </div>

            {selectedAction === 'dock' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Dock
                </label>
                {checkingDocks ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Checking dock availability...
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedDockId}
                      onChange={(e) => setSelectedDockId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                      required={selectedAction === 'dock'}
                    >
                      <option value="">Select a dock</option>
                      {availableDocks.length > 0 ? (
                        availableDocks.map(dock => (
                          <option key={dock.id} value={dock.id}>
                            {dock.name} ({dock.type})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No available docks</option>
                      )}
                    </select>
                    {availableDocks.length === 0 && !checkingDocks && (
                      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                        All docks are currently occupied. Please try again later.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

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
              disabled={loading || (selectedAction === 'dock' && !selectedDockId) || (selectedAction === 'dock' && availableDocks.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 