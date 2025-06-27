'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc, writeBatch, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Truck {
  id: string;
  vehicleNumber: string;
  driverName: string;
  transporterName: string;
  status: string;
  currentLocation?: string;
  gate?: string;
  updatedAt?: string;
}

export default function TruckStatusView() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'trucks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trucksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Truck[];
      
      // Sort by updatedAt in descending order
      trucksData.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setTrucks(trucksData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching trucks:', err);
      setError('Failed to load trucks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const deleteAllTrucks = async () => {
    if (trucks.length === 0) {
      setError('No trucks to delete');
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      setIsDeleting(true);
      
      // Step 1: Collect all truck IDs and vehicle numbers
      const truckIds = trucks.map(truck => truck.id);
      const vehicleNumbers = trucks.map(truck => truck.vehicleNumber);
      
      // Step 2: Delete related entries in weighbridgeEntries collection
      const weighbridgeQuery = query(
        collection(db, 'weighbridgeEntries'),
        where('truckNumber', 'in', vehicleNumbers)
      );
      
      const weighbridgeSnapshot = await getDocs(weighbridgeQuery);
      if (!weighbridgeSnapshot.empty) {
        const weighbridgeBatch = writeBatch(db);
        weighbridgeSnapshot.docs.forEach(doc => {
          weighbridgeBatch.delete(doc.ref);
        });
        await weighbridgeBatch.commit();
        console.log(`Deleted ${weighbridgeSnapshot.size} weighbridge entries`);
      }
      
      // Step 3: Delete related entries in dockOperations collection
      const dockOperationsQuery = query(
        collection(db, 'dockOperations'),
        where('truckNumber', 'in', vehicleNumbers)
      );
      
      const dockOperationsSnapshot = await getDocs(dockOperationsQuery);
      if (!dockOperationsSnapshot.empty) {
        const dockOperationsBatch = writeBatch(db);
        dockOperationsSnapshot.docs.forEach(doc => {
          dockOperationsBatch.delete(doc.ref);
        });
        await dockOperationsBatch.commit();
        console.log(`Deleted ${dockOperationsSnapshot.size} dock operations`);
      }
      
      // Step 4: Delete related entries in plantTracking collection
      const plantTrackingQuery = query(
        collection(db, 'plantTracking'),
        where('truckNumber', 'in', vehicleNumbers)
      );
      
      const plantTrackingSnapshot = await getDocs(plantTrackingQuery);
      if (!plantTrackingSnapshot.empty) {
        const plantTrackingBatch = writeBatch(db);
        plantTrackingSnapshot.docs.forEach(doc => {
          plantTrackingBatch.delete(doc.ref);
        });
        await plantTrackingBatch.commit();
        console.log(`Deleted ${plantTrackingSnapshot.size} plant tracking entries`);
      }
      
      // Step 5: Delete related entries in audit collections
      const auditCollections = [
        'weighbridgeAudit',
        'gateGuardAudit',
        'truckSchedulingAudit',
        'dockOperationsAudit'
      ];
      
      for (const auditCollection of auditCollections) {
        // Try by truckNumber first
        const auditByTruckNumberQuery = query(
          collection(db, auditCollection),
          where('truckNumber', 'in', vehicleNumbers)
        );
        
        const auditByTruckNumberSnapshot = await getDocs(auditByTruckNumberQuery);
        if (!auditByTruckNumberSnapshot.empty) {
          const auditBatch = writeBatch(db);
          auditByTruckNumberSnapshot.docs.forEach(doc => {
            auditBatch.delete(doc.ref);
          });
          await auditBatch.commit();
          console.log(`Deleted ${auditByTruckNumberSnapshot.size} entries from ${auditCollection} by truckNumber`);
        }
        
        // Try by truckId as well (some collections might use truckId instead of truckNumber)
        const auditByTruckIdQuery = query(
          collection(db, auditCollection),
          where('truckId', 'in', truckIds)
        );
        
        const auditByTruckIdSnapshot = await getDocs(auditByTruckIdQuery);
        if (!auditByTruckIdSnapshot.empty) {
          const auditBatch = writeBatch(db);
          auditByTruckIdSnapshot.docs.forEach(doc => {
            auditBatch.delete(doc.ref);
          });
          await auditBatch.commit();
          console.log(`Deleted ${auditByTruckIdSnapshot.size} entries from ${auditCollection} by truckId`);
        }
        
        // Try by vehicleNumber as well (some collections might use vehicleNumber instead of truckNumber)
        const auditByVehicleNumberQuery = query(
          collection(db, auditCollection),
          where('vehicleNumber', 'in', vehicleNumbers)
        );
        
        const auditByVehicleNumberSnapshot = await getDocs(auditByVehicleNumberQuery);
        if (!auditByVehicleNumberSnapshot.empty) {
          const auditBatch = writeBatch(db);
          auditByVehicleNumberSnapshot.docs.forEach(doc => {
            auditBatch.delete(doc.ref);
          });
          await auditBatch.commit();
          console.log(`Deleted ${auditByVehicleNumberSnapshot.size} entries from ${auditCollection} by vehicleNumber`);
        }
      }
      
      // Step 6: Delete the trucks themselves using batched writes
      const batchSize = 500; // Firestore batch limit is 500 operations
      const batches = Math.ceil(trucks.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = writeBatch(db);
        const start = i * batchSize;
        const end = Math.min(trucks.length, (i + 1) * batchSize);
        
        trucks.slice(start, end).forEach(truck => {
          const truckRef = doc(db, 'trucks', truck.id);
          batch.delete(truckRef);
        });
        
        await batch.commit();
      }
      
      console.log(`Deleted ${trucks.length} trucks`);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting trucks:', err);
      setError('Failed to delete trucks');
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'in-process':
        return 'In Process';
      case 'pending-approval':
        return 'Pending Approval';
      case 'inside-plant':
        return 'Inside Plant';
      case 'at_dock':
        return 'At Dock';
      case 'at_parking':
        return 'At Parking';
      case 'at_weighbridge':
        return 'At Weighbridge';
      case 'at_loading':
        return 'At Loading';
      case 'at_unloading':
        return 'At Unloading';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in-process':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending-approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'inside-plant':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'at_dock':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'at_parking':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      case 'at_weighbridge':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'at_loading':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'at_unloading':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredTrucks = trucks.filter(truck => 
    truck.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    truck.transporterName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="w-full md:w-1/2 mb-2 md:mb-0">
            <input
              type="text"
              placeholder="Search trucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={trucks.length === 0 || isDeleting}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Trucks
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transporter</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gate</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.vehicleNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.driverName}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.transporterName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(truck.status)}`}>
                      {getStatusDisplay(truck.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{truck.gate || '-'}</td>
                </tr>
              ))}
              {filteredTrucks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No trucks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete All Trucks Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              Delete All Trucks
            </h3>
            <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete all {trucks.length} trucks from the system? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllTrucks}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 