'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, Timestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import WeighingModal from './WeighingModal';
import NextMilestoneModal from './NextMilestoneModal';
import { updateTruckLocationAndStatus } from '@/lib/firestore';

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
  rejectionRemarks?: string;
}

interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
  isActive: boolean;
  capacity: number;
  location: string;
}

export default function WeighbridgeTruckList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeighbridgeEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<WeighbridgeEntry | null>(null);
  const [isWeighingModalOpen, setIsWeighingModalOpen] = useState(false);
  const [isNextMilestoneModalOpen, setIsNextMilestoneModalOpen] = useState(false);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
    fetchDocks();
  }, []);

  const fetchDocks = async () => {
    try {
      const docksQuery = query(
        collection(db, 'docks'),
        where('isActive', '==', true)
      );
      const docksSnapshot = await getDocs(docksQuery);
      const docksData = docksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dock));
      setDocks(docksData);
    } catch (error) {
      console.error('Error fetching docks:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const entriesQuery = query(
        collection(db, 'weighbridgeEntries'),
        orderBy('inTime', 'desc')
      );
      const snapshot = await getDocs(entriesQuery);
      console.log('Total weighbridge entries found:', snapshot.docs.length);
      
      const entriesData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Entry data:', data);
          return {
            id: doc.id,
            ...data
          } as WeighbridgeEntry;
        })
        .filter(entry => {
          const milestone = entry.currentMilestone?.toUpperCase?.() || '';
          return milestone === 'PENDING_WEIGHING' || 
                 milestone === 'WEIGHED' || 
                 milestone === 'AT_PARKING' || 
                 milestone === 'AT_DOCK';
        });
      
      console.log('Filtered weighbridge entries:', entriesData.length);
      console.log('Entry milestones:', entriesData.map(e => e.currentMilestone));
      
      setEntries(entriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setLoading(false);
    }
  };

  // Create audit entry function
  const createAuditEntry = async (entry: WeighbridgeEntry, action: string, details: any) => {
    try {
      await addDoc(collection(db, 'weighbridgeAudit'), {
        truckNumber: entry.truckNumber,
        transporterName: entry.transporterName,
        action: action,
        timestamp: Timestamp.now(),
        performedBy: user?.uid || 'unknown',
        performedByName: user?.displayName || 'Unknown User',
        details: details
      });
    } catch (error) {
      console.error('Error creating audit entry:', error);
    }
  };

  const handleWeigh = (entry: WeighbridgeEntry) => {
    setSelectedEntry(entry);
    setIsWeighingModalOpen(true);
  };

  const handleOpenNextMilestoneModal = (entry: WeighbridgeEntry) => {
    setSelectedEntry(entry);
    setIsNextMilestoneModalOpen(true);
  };

  const handleMoveToPark = async (entry: WeighbridgeEntry) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find the truck document
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', entry.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        await updateTruckLocationAndStatus(
          truckDoc.id,
          'Parking Area',
          'at_parking',
          user.uid,
          {
            weighbridgeId: entry.id
          }
        );
      }

      // Create audit entry
      await createAuditEntry(entry, 'MOVED_TO_PARKING', {
        milestone: 'AT_PARKING',
        grossWeight: entry.grossWeight,
        tareWeight: entry.tareWeight,
        netWeight: entry.netWeight
      });

      fetchEntries();
    } catch (error) {
      console.error('Error moving to parking:', error);
    }
  };

  const handleMoveToDock = async (entry: WeighbridgeEntry, selectedDockId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const selectedDock = docks.find(d => d.id === selectedDockId);
      if (!selectedDock) return;

      // Find the truck document
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', entry.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        await updateTruckLocationAndStatus(
          truckDoc.id,
          selectedDock.name,
          'at_dock',
          user.uid,
          {
            dockId: selectedDockId,
            dockName: selectedDock.name,
            weighbridgeId: entry.id
          }
        );
      }

      // Create audit entry
      await createAuditEntry(entry, 'ASSIGNED_TO_DOCK', {
        milestone: 'AT_DOCK',
        dockName: selectedDock.name,
        grossWeight: entry.grossWeight,
        tareWeight: entry.tareWeight,
        netWeight: entry.netWeight
      });

      fetchEntries();
    } catch (error) {
      console.error('Error moving to dock:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Truck Number</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Transporter</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Date</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Time</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Gross Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Tare Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Net Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Status</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">
                {entry.truckNumber}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.transporterName}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.inTime.toDate().toLocaleDateString()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.inTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.grossWeight ? `${entry.grossWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.tareWeight ? `${entry.tareWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.netWeight ? `${entry.netWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  entry.currentMilestone === 'PENDING_WEIGHING' && entry.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                  entry.currentMilestone === 'PENDING_WEIGHING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                  entry.currentMilestone === 'WEIGHED' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                  entry.currentMilestone === 'AT_PARKING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                }`}>
                  {entry.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : entry.currentMilestone.replace('_', ' ')}
                </span>
                {entry.status === 'WEIGHING_REJECTED' && (
                  <div className="mt-1">
                    <span className="text-xs text-red-600 dark:text-red-400">
                      Rejected
                    </span>
                  </div>
                )}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <div className="flex space-x-1">
                  {entry.currentMilestone === 'PENDING_WEIGHING' && entry.status !== 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleWeigh(entry)}
                      className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                      title="Weigh Truck"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </button>
                  )}
                  
                  {entry.status === 'PENDING_APPROVAL' && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Awaiting
                    </span>
                  )}
                  
                  {(entry.currentMilestone === 'WEIGHED' || entry.currentMilestone === 'AT_PARKING') && (
                    <button
                      onClick={() => handleOpenNextMilestoneModal(entry)}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none"
                      title="Next Action"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isWeighingModalOpen && selectedEntry && (
        <WeighingModal
          isOpen={isWeighingModalOpen}
          onClose={() => {
            setIsWeighingModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
          }}
          entry={selectedEntry}
          onWeighingComplete={(weightDetails) => {
            if (selectedEntry) {
              createAuditEntry(selectedEntry, 'WEIGHED', {
                milestone: 'WEIGHED',
                ...weightDetails
              });
            }
          }}
        />
      )}

      {isNextMilestoneModalOpen && selectedEntry && (
        <NextMilestoneModal
          isOpen={isNextMilestoneModalOpen}
          onClose={() => {
            setIsNextMilestoneModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
          }}
          entry={selectedEntry}
          docks={docks}
          onMoveToPark={handleMoveToPark}
          onMoveToDock={handleMoveToDock}
        />
      )}
    </div>
  );
} 