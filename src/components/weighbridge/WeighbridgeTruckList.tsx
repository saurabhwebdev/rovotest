'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, Timestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import WeighingModal from './WeighingModal';
import NextMilestoneModal from './NextMilestoneModal';

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
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeighbridgeEntry));
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
      await updateDoc(doc(db, 'weighbridgeEntries', entry.id), {
        currentMilestone: 'AT_PARKING',
        status: 'AT_PARKING',
        parkingTime: Timestamp.now()
      });

      // Update plant tracking
      const plantTrackingQuery = query(
        collection(db, 'plantTracking'),
        where('weighbridgeEntryId', '==', entry.id)
      );
      const plantTrackingSnapshot = await getDocs(plantTrackingQuery);
      if (!plantTrackingSnapshot.empty) {
        const trackingDoc = plantTrackingSnapshot.docs[0];
        await updateDoc(doc(db, 'plantTracking', trackingDoc.id), {
          location: 'Parking Area',
          status: 'PARKED',
          lastUpdated: Timestamp.now()
        });
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
      const selectedDock = docks.find(d => d.id === selectedDockId);
      if (!selectedDock) return;

      await updateDoc(doc(db, 'weighbridgeEntries', entry.id), {
        currentMilestone: 'AT_DOCK',
        status: 'AT_DOCK',
        dockId: selectedDockId,
        dockName: selectedDock.name,
        dockAssignmentTime: Timestamp.now()
      });

      // Update plant tracking
      const plantTrackingQuery = query(
        collection(db, 'plantTracking'),
        where('weighbridgeEntryId', '==', entry.id)
      );
      const plantTrackingSnapshot = await getDocs(plantTrackingQuery);
      if (!plantTrackingSnapshot.empty) {
        const trackingDoc = plantTrackingSnapshot.docs[0];
        await updateDoc(doc(db, 'plantTracking', trackingDoc.id), {
          location: selectedDock.name,
          status: 'AT_DOCK',
          dockId: selectedDockId,
          lastUpdated: Timestamp.now()
        });
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
      <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Truck Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Transporter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              In Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Weight Info
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Current Milestone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {entry.truckNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {entry.transporterName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {entry.inTime.toDate().toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {entry.grossWeight ? (
                  <>
                    <div>Gross: {entry.grossWeight} kg</div>
                    <div>Tare: {entry.tareWeight} kg</div>
                    <div>Net: {entry.netWeight} kg</div>
                    <div className="text-xs text-gray-400">
                      {entry.weighingTime?.toDate().toLocaleString()}
                    </div>
                  </>
                ) : (
                  'Not weighed'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      Rejected: {entry.rejectionRemarks}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {entry.currentMilestone === 'PENDING_WEIGHING' && entry.status !== 'PENDING_APPROVAL' && (
                  <button
                    onClick={() => handleWeigh(entry)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    title="Weigh Truck"
                  >
                    Weigh Truck
                  </button>
                )}
                {entry.status === 'PENDING_APPROVAL' && (
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    Awaiting Approval
                  </span>
                )}
                {(entry.currentMilestone === 'WEIGHED' || entry.currentMilestone === 'AT_PARKING') && (
                  <button
                    onClick={() => handleOpenNextMilestoneModal(entry)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Action
                  </button>
                )}
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