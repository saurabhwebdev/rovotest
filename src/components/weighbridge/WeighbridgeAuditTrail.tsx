'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, Timestamp, limit } from 'firebase/firestore';
import { exportToCSV } from '@/lib/excelUtils';

interface AuditEntry {
  id: string;
  truckNumber: string;
  transporterName: string;
  action: string;
  timestamp: Timestamp;
  performedBy: string;
  performedByName: string;
  details: {
    milestone?: string;
    grossWeight?: number;
    tareWeight?: number;
    netWeight?: number;
    dockName?: string;
  };
}

interface WeighbridgeAuditTrailProps {
  showFullHistoryByDefault?: boolean;
}

export default function WeighbridgeAuditTrail({ showFullHistoryByDefault = false }: WeighbridgeAuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(showFullHistoryByDefault);

  useEffect(() => {
    fetchAuditEntries();
  }, [showFullHistory]);

  const fetchAuditEntries = async () => {
    try {
      const entriesLimit = showFullHistory ? 100 : 20;
      const auditQuery = query(
        collection(db, 'weighbridgeAudit'),
        orderBy('timestamp', 'desc'),
        limit(entriesLimit)
      );
      
      const snapshot = await getDocs(auditQuery);
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditEntry));
      
      setAuditEntries(entriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching audit entries:', error);
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'WEIGHED':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'MOVED_TO_PARKING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'ASSIGNED_TO_DOCK':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'APPROVED':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const handleExportToCSV = () => {
    const csvData = auditEntries.map(entry => ({
      'Time': entry.timestamp.toDate().toLocaleString(),
      'Truck Number': entry.truckNumber,
      'Transporter': entry.transporterName,
      'Action': entry.action.replace(/_/g, ' '),
      'Milestone': entry.details.milestone ? entry.details.milestone.replace(/_/g, ' ') : '',
      'Gross Weight (kg)': entry.details.grossWeight || '',
      'Tare Weight (kg)': entry.details.tareWeight || '',
      'Net Weight (kg)': entry.details.netWeight || '',
      'Dock': entry.details.dockName || '',
      'Performed By': entry.performedByName || 'Unknown User'
    }));
    
    exportToCSV(csvData, 'weighbridge-audit-trail');
  };

  if (loading) {
    return <div className="text-center py-4">Loading audit trail...</div>;
  }

  if (auditEntries.length === 0) {
    return <div className="text-center py-4 text-gray-500 dark:text-gray-400">No audit entries found</div>;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Weighbridge Audit Trail</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showFullHistory ? 'Show Less' : 'View Full History'}
          </button>
          <button
            onClick={handleExportToCSV}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Truck
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Transporter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Performed By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {auditEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {entry.timestamp.toDate().toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {entry.truckNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {entry.transporterName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(entry.action)}`}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                  {entry.details.milestone && <div>Milestone: {entry.details.milestone.replace(/_/g, ' ')}</div>}
                  {entry.details.grossWeight && <div>Gross: {entry.details.grossWeight} kg</div>}
                  {entry.details.tareWeight && <div>Tare: {entry.details.tareWeight} kg</div>}
                  {entry.details.netWeight && <div>Net: {entry.details.netWeight} kg</div>}
                  {entry.details.dockName && <div>Dock: {entry.details.dockName}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {entry.performedByName || 'Unknown User'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 