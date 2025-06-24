'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import HandoverDetailModal from '@/components/shift-handover/HandoverDetailModal';

interface HandoverRecord {
  id: string;
  shiftType: 'Morning' | 'Afternoon' | 'Night';
  handoverDate: Timestamp;
  handoverTime: string;
  handoverBy: string;
  handoverByEmail: string;
  receivedBy: string;
  receivedByEmail: string;
  department: string;
  pendingTasks: string;
  completedTasks: string;
  notes: string;
  status: 'Pending' | 'Completed';
  createdAt: Timestamp;
}

export default function ShiftHandoverApprovalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HandoverRecord | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Completed'>('Pending');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin');
      } else {
        // In a real app, you would check user permissions here
        setIsAuthorized(true);
        fetchHandoverRecords();
      }
    }
  }, [user, loading, router, filterStatus]);

  const fetchHandoverRecords = async () => {
    setIsLoading(true);
    try {
      const handoverCollection = collection(db, 'shiftHandovers');
      let handoverQuery;

      if (filterStatus === 'all') {
        handoverQuery = query(
          handoverCollection, 
          orderBy('handoverDate', 'desc'),
          orderBy('createdAt', 'desc')
        );
      } else {
        handoverQuery = query(
          handoverCollection, 
          where('status', '==', filterStatus),
          orderBy('handoverDate', 'desc'),
          orderBy('createdAt', 'desc')
        );
      }

      const handoverSnapshot = await getDocs(handoverQuery);
      const records = handoverSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HandoverRecord));
      setHandoverRecords(records);
    } catch (error) {
      console.error('Error fetching handover records:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openRecordDetails = (record: HandoverRecord) => {
    setSelectedRecord(record);
  };

  const handleStatusChange = async (recordId: string, newStatus: 'Pending' | 'Completed') => {
    try {
      const handoverRef = doc(db, 'shiftHandovers', recordId);
      await updateDoc(handoverRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      // Refresh the records
      fetchHandoverRecords();
      
      // Close the modal if open
      if (selectedRecord?.id === recordId) {
        setSelectedRecord(null);
      }
    } catch (error) {
      console.error('Error updating handover status:', error);
      alert('Failed to update handover status');
    }
  };

  const filteredRecords = handoverRecords.filter(record => {
    // Filter by search term
    return (
      record.handoverBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.receivedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <PagePermissionWrapper pageId="admin-shift-handover-approval">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Shift Handover Approval</h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search handovers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <svg
              className="absolute right-2 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Pending' | 'Completed')}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800"
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            
            <button 
              className="ml-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
              title="Refresh List"
              onClick={() => fetchHandoverRecords()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              Handover Records
            </h3>
          </div>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No handover records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Shift
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Department
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Handed By
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Received By
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        {formatDate(record.handoverDate)}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        {record.shiftType}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        {record.department}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        <div>{record.handoverBy}</div>
                        <div className="text-xs text-gray-400">{record.handoverByEmail}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        <div>{record.receivedBy}</div>
                        <div className="text-xs text-gray-400">{record.receivedByEmail}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => openRecordDetails(record)}
                            className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {record.status === 'Pending' ? (
                            <button
                              onClick={() => handleStatusChange(record.id, 'Completed')}
                              className="text-gray-500 hover:text-green-600 focus:outline-none"
                              title="Approve Handover"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(record.id, 'Pending')}
                              className="text-gray-500 hover:text-yellow-600 focus:outline-none"
                              title="Revert to Pending"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {selectedRecord && (
          <HandoverDetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onUpdate={fetchHandoverRecords}
            hideApprovalButtons={true}
          />
        )}
      </div>
    </PagePermissionWrapper>
  );
} 