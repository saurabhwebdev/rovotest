'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import HandoverDetailModal from '@/components/shift-handover/HandoverDetailModal';
import NewHandoverModal from '@/components/shift-handover/NewHandoverModal';
import { useRouter } from 'next/navigation';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

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

export default function ShiftHandoverPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HandoverRecord | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
  }, [user, loading, router]);

  const fetchHandoverRecords = async () => {
    setIsLoading(true);
    try {
      const handoverCollection = collection(db, 'shiftHandovers');
      const handoverQuery = query(
        handoverCollection, 
        orderBy('handoverDate', 'desc'),
        orderBy('createdAt', 'desc')
      );
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

  const handleModalSuccess = () => {
    setIsAddingRecord(false);
    fetchHandoverRecords();
  };

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
    <PagePermissionWrapper pageId="admin-shift-handover">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Shift Handover & Takeover</h1>
        
        <div className="mb-6">
          <button
            onClick={() => setIsAddingRecord(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Create New Handover
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              Recent Handover Records
            </h3>
          </div>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : handoverRecords.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No handover records found. Create your first record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date & Shift
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Handover By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Received By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {handoverRecords.map((record) => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => openRecordDetails(record)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(record.handoverDate)} - {record.shiftType} Shift
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.handoverBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.receivedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'Completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {record.status}
                        </span>
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
          />
        )}

        {isAddingRecord && (
          <NewHandoverModal
            onClose={() => setIsAddingRecord(false)}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </PagePermissionWrapper>
  );
} 