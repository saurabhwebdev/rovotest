'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface AuditTrailProps {
  truckId?: string;
  showFullHistoryByDefault?: boolean;
}

interface AuditEntry {
  id: string;
  truckId: string;
  vehicleNumber: string;
  action: string;
  timestamp: string;
  userId: string;
  userName: string;
  details?: {
    [key: string]: any;
  };
}

export default function TruckSchedulingAuditTrail({ truckId, showFullHistoryByDefault = false }: AuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(showFullHistoryByDefault);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Create query based on whether we're showing history for a specific truck
      let auditQuery;
      if (truckId) {
        auditQuery = query(
          collection(db, 'truckSchedulingAudit'),
          where('truckId', '==', truckId),
          orderBy('timestamp', 'desc'),
          limit(showFullHistory ? 100 : 10)
        );
      } else {
        auditQuery = query(
          collection(db, 'truckSchedulingAudit'),
          orderBy('timestamp', 'desc'),
          limit(showFullHistory ? 100 : 20)
        );
      }

      const unsubscribe = onSnapshot(auditQuery, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AuditEntry[];
        
        setAuditEntries(entries);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching audit trail:', err);
        setError('Failed to load audit trail data');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up audit trail listener:', err);
      setError('Failed to set up audit trail listener');
      setLoading(false);
    }
  }, [truckId, user, showFullHistory]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch (err) {
      return timestamp;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'updated':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!truckId && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Truck Scheduling Audit Trail</h3>
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showFullHistory ? 'Show Less' : 'Show Full History'}
          </button>
        </div>
      )}

      {auditEntries.length === 0 ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-center">No audit records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {auditEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {entry.vehicleNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {entry.userName || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {entry.details && Object.keys(entry.details).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-indigo-600 dark:text-indigo-400 hover:underline">View Details</summary>
                        <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ) : (
                      <span>No additional details</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 