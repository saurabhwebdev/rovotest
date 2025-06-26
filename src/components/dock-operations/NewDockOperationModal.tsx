'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';

interface NewDockOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
}

interface WeighbridgeEntry {
  id: string;
  truckNumber: string;
  status: string;
  plantTrackingId?: string;
}

export default function NewDockOperationModal({ isOpen, onClose }: NewDockOperationModalProps) {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [weighbridgeEntries, setWeighbridgeEntries] = useState<WeighbridgeEntry[]>([]);
  const [selectedDock, setSelectedDock] = useState('');
  const [selectedEntry, setSelectedEntry] = useState('');
  const [operationType, setOperationType] = useState<'LOADING' | 'UNLOADING'>('LOADING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocks();
      fetchWeighbridgeEntries();
    }
  }, [isOpen]);

  const fetchDocks = async () => {
    setError(null);
    try {
      const docksQuery = query(
        collection(db, 'docks'),
        where('isActive', '==', true),
        orderBy('name')
      );
      const querySnapshot = await getDocs(docksQuery);
      const docksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dock[];
      
      console.log('Fetched docks:', docksData);
      
      if (docksData.length === 0) {
        console.warn('No active docks found in the database');
      }
      
      setDocks(docksData);
    } catch (error) {
      console.error('Error fetching docks:', error);
      setError('Failed to load docks. Please try again.');
    }
  };

  const fetchWeighbridgeEntries = async () => {
    setError(null);
    try {
      // Modified to fetch trucks that are ready for dock operations
      const entriesQuery = query(
        collection(db, 'weighbridgeEntries'),
        where('currentMilestone', 'in', ['WEIGHED', 'AT_PARKING', 'AT_DOCK']),
        orderBy('inTime', 'desc')
      );
      
      const querySnapshot = await getDocs(entriesQuery);
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeighbridgeEntry[];
      
      console.log('Fetched weighbridge entries:', entriesData);
      
      if (entriesData.length === 0) {
        console.warn('No eligible trucks found for dock operations');
      }
      
      setWeighbridgeEntries(entriesData);
    } catch (error) {
      console.error('Error fetching weighbridge entries:', error);
      setError('Failed to load trucks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const selectedDockData = docks.find(d => d.id === selectedDock);
      const selectedEntryData = weighbridgeEntries.find(w => w.id === selectedEntry);

      if (!selectedDockData || !selectedEntryData) {
        throw new Error('Missing required data');
      }

      // 1. Create dock operation
      const dockOperationRef = await addDoc(collection(db, 'dockOperations'), {
        dockId: selectedDock,
        dockName: selectedDockData.name,
        weighbridgeEntryId: selectedEntry,
        truckNumber: selectedEntryData.truckNumber,
        operationType,
        startTime: Timestamp.now(),
        endTime: null,
        status: 'IN_PROGRESS'
      });

      // 2. Update weighbridge entry status
      await updateDoc(doc(db, 'weighbridgeEntries', selectedEntry), {
        status: operationType === 'LOADING' ? 'LOADING_IN_PROGRESS' : 'UNLOADING_IN_PROGRESS',
        currentDockId: selectedDock,
        dockOperationId: dockOperationRef.id
      });

      // 3. Update plant tracking status
      if (selectedEntryData.plantTrackingId) {
        await updateDoc(doc(db, 'plantTracking', selectedEntryData.plantTrackingId), {
          location: selectedDockData.name,
          status: operationType === 'LOADING' ? 'LOADING_IN_PROGRESS' : 'UNLOADING_IN_PROGRESS',
          dockId: selectedDock,
          dockOperationId: dockOperationRef.id,
          lastUpdated: Timestamp.now()
        });
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating dock operation:', error);
      setError('Failed to create dock operation. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">New Dock Operation</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Truck</label>
              <select
                value={selectedEntry}
                onChange={(e) => setSelectedEntry(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a truck</option>
                {weighbridgeEntries.length === 0 ? (
                  <option disabled>No trucks available</option>
                ) : (
                  weighbridgeEntries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.truckNumber}
                    </option>
                  ))
                )}
              </select>
              {weighbridgeEntries.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No trucks available for dock operations
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2">Dock</label>
              <select
                value={selectedDock}
                onChange={(e) => setSelectedDock(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a dock</option>
                {docks.length === 0 ? (
                  <option disabled>No docks available</option>
                ) : (
                  docks.map((dock) => (
                    <option
                      key={dock.id}
                      value={dock.id}
                      disabled={dock.type !== 'BOTH' && dock.type !== operationType}
                    >
                      {dock.name}
                    </option>
                  ))
                )}
              </select>
              {docks.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No active docks found
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2">Operation Type</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as 'LOADING' | 'UNLOADING')}
                className="w-full p-2 border rounded"
                required
              >
                <option value="LOADING">Loading</option>
                <option value="UNLOADING">Unloading</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!selectedDock || !selectedEntry}
              >
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 