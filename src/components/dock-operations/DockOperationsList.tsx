'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, ArrowRightCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateTruckLocationAndStatus } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface DockOperation {
  id: string;
  truckNumber: string;
  dockId: string;
  dockName: string;
  operationType: 'LOADING' | 'UNLOADING';
  startTime: Timestamp;
  endTime: Timestamp | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  weighbridgeEntryId: string;
}

export default function DockOperationsList() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<DockOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedOperation, setSelectedOperation] = useState<DockOperation | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isNextMilestoneDialogOpen, setIsNextMilestoneDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchDockOperations();

    // Set up interval to update the current time every second
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [showCompleted]);

  const fetchDockOperations = async () => {
    try {
      const status = showCompleted ? 'COMPLETED' : 'IN_PROGRESS';
      const q = query(
        collection(db, 'dockOperations'),
        where('status', '==', status),
        orderBy(showCompleted ? 'endTime' : 'startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const operationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DockOperation[];
      setOperations(operationsData);
    } catch (error) {
      console.error('Error fetching dock operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (operation: DockOperation) => {
    setSelectedOperation(operation);
    setIsConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setSelectedOperation(null);
    setIsConfirmDialogOpen(false);
  };

  const openNextMilestoneDialog = (operation: DockOperation) => {
    setSelectedOperation(operation);
    setIsNextMilestoneDialogOpen(true);
  };

  const closeNextMilestoneDialog = () => {
    setSelectedOperation(null);
    setIsNextMilestoneDialogOpen(false);
  };

  async function handleComplete(operation: DockOperation) {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const now = Timestamp.now();

      // 1. Update dock operation status
      await updateDoc(doc(db, 'dockOperations', operation.id), {
        status: 'COMPLETED',
        endTime: now
      });

      // 2. Find and update truck status
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', operation.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        await updateTruckLocationAndStatus(
          truckDoc.id,
          'Exit Gate',
          operation.operationType === 'LOADING' ? 'loading_completed' : 'unloading_completed',
          user.uid,
          {
            dockId: null,
            dockName: null,
            dockOperationId: null
          }
        );
      }

      // 3. Close dialog and refresh the list
      closeConfirmDialog();
      fetchDockOperations();
    } catch (error) {
      console.error('Error completing dock operation:', error);
    }
  }

  async function handleNextMilestone(operation: DockOperation) {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find and update truck status to exit_ready
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', operation.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        // First update location and status
        await updateTruckLocationAndStatus(
          truckDoc.id,
          'Exit Gate',
          'exit_ready',
          user.uid,
          {}
        );
        
        // Then update the exitReadyTime separately
        await updateDoc(doc(db, 'trucks', truckDoc.id), {
          exitReadyTime: Timestamp.now()
        });
      }

      // Close dialog and refresh the list
      closeNextMilestoneDialog();
      fetchDockOperations();
    } catch (error) {
      console.error('Error processing next milestone:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCompleted(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              !showCompleted
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setShowCompleted(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              showCompleted
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Truck Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Dock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Operation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {showCompleted ? 'End Time' : 'Duration'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {operations.map((operation) => (
              <tr key={operation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {operation.truckNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {operation.dockName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {operation.operationType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {operation.startTime.toDate().toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {showCompleted && operation.endTime
                    ? operation.endTime.toDate().toLocaleString()
                    : getDuration(operation.startTime.toDate(), currentTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    operation.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                    {operation.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {operation.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => openConfirmDialog(operation)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title="Complete Operation"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => openNextMilestoneDialog(operation)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Next Milestone"
                    >
                      <ArrowRightCircle className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dock Operation</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete the {selectedOperation?.operationType.toLowerCase()} operation for truck {selectedOperation?.truckNumber} at dock {selectedOperation?.dockName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <button
              onClick={closeConfirmDialog}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedOperation && handleComplete(selectedOperation)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md"
            >
              Complete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNextMilestoneDialogOpen} onOpenChange={setIsNextMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proceed to Next Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark truck {selectedOperation?.truckNumber} as ready for exit? This will notify the gate guard to process the truck's exit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <button
              onClick={closeNextMilestoneDialog}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedOperation && handleNextMilestone(selectedOperation)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getDuration(startTime: Date, currentTime: Date): string {
  const diff = currentTime.getTime() - startTime.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
} 