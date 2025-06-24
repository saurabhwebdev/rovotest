'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import HandoverDetailModal from '@/components/shift-handover/HandoverDetailModal';
import { useRouter } from 'next/navigation';

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

export default function ShiftHandover() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HandoverRecord | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Form states
  const [shiftType, setShiftType] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');
  const [handoverDate, setHandoverDate] = useState('');
  const [handoverTime, setHandoverTime] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [receivedByEmail, setReceivedByEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [completedTasks, setCompletedTasks] = useState('');
  const [notes, setNotes] = useState('');
  
  // Departments list
  const departments = [
    'Gate Operations',
    'Weighbridge',
    'Dock Operations',
    'Warehouse',
    'Security',
    'Administration',
    'IT Support',
    'Maintenance'
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to submit a handover record');
      return;
    }
    
    if (!handoverDate || !handoverTime || !receivedBy || !department || !pendingTasks) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const handoverData = {
        shiftType,
        handoverDate: Timestamp.fromDate(new Date(handoverDate)),
        handoverTime,
        handoverBy: user.displayName || 'Unknown User',
        handoverByEmail: user.email || '',
        receivedBy,
        receivedByEmail,
        department,
        pendingTasks,
        completedTasks,
        notes,
        status: 'Pending' as const,
        createdAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'shiftHandovers'), handoverData);
      resetForm();
      fetchHandoverRecords();
      alert('Shift handover record submitted successfully');
    } catch (error) {
      console.error('Error adding handover record:', error);
      alert('Failed to submit handover record');
    }
  };
  
  const resetForm = () => {
    setShiftType('Morning');
    setHandoverDate('');
    setHandoverTime('');
    setReceivedBy('');
    setReceivedByEmail('');
    setDepartment('');
    setPendingTasks('');
    setCompletedTasks('');
    setNotes('');
    setIsAddingRecord(false);
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shift Handover & Takeover</h1>
      
      {!isAddingRecord ? (
        <div className="mb-6">
          <button
            onClick={() => setIsAddingRecord(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Create New Handover
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Shift Handover Record</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shift Type*
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Afternoon">Afternoon Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department*
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Handover Date*
                </label>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Handover Time*
                </label>
                <input
                  type="time"
                  value={handoverTime}
                  onChange={(e) => setHandoverTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Handed Over By
                </label>
                <input
                  type="text"
                  value={user?.displayName || user?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Received By*
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Name of person receiving handover"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Receiver's Email
                </label>
                <input
                  type="email"
                  value={receivedByEmail}
                  onChange={(e) => setReceivedByEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Email of person receiving handover"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pending Tasks / Issues*
              </label>
              <textarea
                value={pendingTasks}
                onChange={(e) => setPendingTasks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="List all pending tasks, issues or follow-ups"
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Completed Tasks
              </label>
              <textarea
                value={completedTasks}
                onChange={(e) => setCompletedTasks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="List all tasks completed during your shift"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Any additional information or notes"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Submit Handover
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
    </div>
  );
} 