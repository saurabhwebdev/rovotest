'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

interface Weighbridge {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  maxCapacity: number;
  operatorName?: string;
  lastMaintenance?: string;
}

export default function WeighbridgeManagementPage() {
  const { user } = useAuth();
  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWeighbridge, setNewWeighbridge] = useState({
    name: '',
    location: '',
    maxCapacity: 0,
    operatorName: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'weighbridges'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weighbridgeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Weighbridge[];
      setWeighbridges(weighbridgeData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddWeighbridge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if this is the first weighbridge
      const isFirstWeighbridge = weighbridges.length === 0;
      
      await addDoc(collection(db, 'weighbridges'), {
        ...newWeighbridge,
        isActive: isFirstWeighbridge, // Activate if it's the first weighbridge
        lastMaintenance: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setNewWeighbridge({ name: '', location: '', maxCapacity: 0, operatorName: '' });
    } catch (err) {
      setError('Failed to add weighbridge');
      console.error(err);
    }
  };

  const toggleWeighbridgeStatus = async (weighbridge: Weighbridge) => {
    try {
      // If activating this weighbridge, deactivate all others
      if (!weighbridge.isActive) {
        const batch = writeBatch(db);
        weighbridges.forEach(wb => {
          if (wb.id !== weighbridge.id && wb.isActive) {
            const wbRef = doc(db, 'weighbridges', wb.id);
            batch.update(wbRef, { isActive: false });
          }
        });
        await batch.commit();
      }
      
      const weighbridgeRef = doc(db, 'weighbridges', weighbridge.id);
      await updateDoc(weighbridgeRef, {
        isActive: !weighbridge.isActive
      });
    } catch (err) {
      setError('Failed to update weighbridge status');
      console.error(err);
    }
  };

  const deleteWeighbridge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weighbridge?')) return;
    
    try {
      await deleteDoc(doc(db, 'weighbridges', id));
    } catch (err) {
      setError('Failed to delete weighbridge');
      console.error(err);
    }
  };

  return (
    <PagePermissionWrapper pageId="admin-weighbridge-management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Weighbridge Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure and manage plant weighbridges
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Weighbridge
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Max Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {weighbridges.map((weighbridge) => (
                  <tr key={weighbridge.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {weighbridge.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {weighbridge.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {weighbridge.maxCapacity} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {weighbridge.operatorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        weighbridge.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {weighbridge.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleWeighbridgeStatus(weighbridge)}
                        className={`mr-2 px-3 py-1 rounded-md ${
                          weighbridge.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {weighbridge.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteWeighbridge(weighbridge.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Weighbridge Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold">Add New Weighbridge</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddWeighbridge} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weighbridge Name
                    </label>
                    <input
                      type="text"
                      value={newWeighbridge.name}
                      onChange={(e) => setNewWeighbridge({...newWeighbridge, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newWeighbridge.location}
                      onChange={(e) => setNewWeighbridge({...newWeighbridge, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Capacity (kg)
                    </label>
                    <input
                      type="number"
                      value={newWeighbridge.maxCapacity}
                      onChange={(e) => setNewWeighbridge({...newWeighbridge, maxCapacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Operator Name
                    </label>
                    <input
                      type="text"
                      value={newWeighbridge.operatorName}
                      onChange={(e) => setNewWeighbridge({...newWeighbridge, operatorName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Add Weighbridge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PagePermissionWrapper>
  );
} 