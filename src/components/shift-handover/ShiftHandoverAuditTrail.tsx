'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import HandoverDetailModal from './HandoverDetailModal';
import { exportToCSV } from '@/lib/excelUtils';

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

export default function ShiftHandoverAuditTrail() {
  const { user } = useAuth();
  const [handoverRecords, setHandoverRecords] = useState<HandoverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HandoverRecord | null>(null);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShift, setFilterShift] = useState('');
  
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
    if (user) {
      fetchHandoverRecords();
    }
  }, [user]);

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
  
  const filteredRecords = handoverRecords.filter(record => {
    let matchesDepartment = true;
    let matchesStatus = true;
    let matchesShift = true;
    
    if (filterDepartment) {
      matchesDepartment = record.department === filterDepartment;
    }
    
    if (filterStatus) {
      matchesStatus = record.status === filterStatus;
    }
    
    if (filterShift) {
      matchesShift = record.shiftType === filterShift;
    }
    
    return matchesDepartment && matchesStatus && matchesShift;
  });

  const handleExportToCSV = () => {
    const csvData = filteredRecords.map(record => ({
      'Date': formatDate(record.handoverDate),
      'Shift': record.shiftType,
      'Department': record.department,
      'Handover By': record.handoverBy,
      'Handover By Email': record.handoverByEmail,
      'Received By': record.receivedBy,
      'Received By Email': record.receivedByEmail,
      'Status': record.status,
      'Pending Tasks': record.pendingTasks,
      'Completed Tasks': record.completedTasks,
      'Notes': record.notes
    }));
    
    exportToCSV(csvData, 'shift-handover-audit-trail');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shift Handover Audit Trail</h1>
        <button
          onClick={handleExportToCSV}
          disabled={filteredRecords.length === 0 || isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Export to CSV</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Shift
            </label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Afternoon">Afternoon Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            Handover Records
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredRecords.length} records found
          </span>
        </div>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No handover records found matching your filters.
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
                {filteredRecords.map((record) => (
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
                      <div>{record.handoverBy}</div>
                      <div className="text-xs text-gray-400">{record.handoverByEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{record.receivedBy}</div>
                      <div className="text-xs text-gray-400">{record.receivedByEmail}</div>
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