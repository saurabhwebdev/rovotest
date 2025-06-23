'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';

interface ApprovalHistoryProps {
  limit?: number;
  showFilters?: boolean;
}

interface ApprovalRequest {
  id: string;
  type: 'WEIGHMENT' | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: any;
  createdBy: string;
  data: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectedBy?: string;
  remarks?: string;
}

export default function ApprovalHistory({ limit = 50, showFilters = true }: ApprovalHistoryProps) {
  const [history, setHistory] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'WEIGHMENT'>('all');

  useEffect(() => {
    fetchApprovalHistory();
  }, [filter, typeFilter]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      
      // Build query based on filters
      let baseQuery = query(
        collection(db, 'approvalRequests'),
        orderBy('createdAt', 'desc')
      );
      
      // Apply status filter if not 'all'
      if (filter !== 'all') {
        baseQuery = query(
          baseQuery,
          where('status', '==', filter === 'approved' ? 'APPROVED' : 'REJECTED')
        );
      } else {
        // If 'all' is selected, we still want to exclude pending items from history
        baseQuery = query(
          baseQuery,
          where('status', 'in', ['APPROVED', 'REJECTED'])
        );
      }
      
      // Apply type filter if not 'all'
      if (typeFilter !== 'all') {
        baseQuery = query(
          baseQuery,
          where('type', '==', typeFilter)
        );
      }
      
      const snapshot = await getDocs(baseQuery);
      
      const historyData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ApprovalRequest[];
      
      // Apply limit
      setHistory(historyData.slice(0, limit));
    } catch (error) {
      console.error('Error fetching approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'WEIGHMENT':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const renderApprovalDetails = (request: ApprovalRequest) => {
    if (request.type === 'WEIGHMENT') {
      return (
        <>
          <p className="text-gray-900 dark:text-white font-medium">
            {request.data.truckNumber} - {request.data.transporterName}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Order: {request.data.orderNumber}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Net Weight: {request.data.netWeight} kg (Gross: {request.data.grossWeight} kg, Tare: {request.data.tareWeight} kg)
          </p>
        </>
      );
    }
    
    // Default case for other approval types
    return (
      <p className="text-gray-900 dark:text-white">
        {JSON.stringify(request.data).substring(0, 100)}...
      </p>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Approval History</h2>
        
        {showFilters && (
          <div className="flex space-x-3">
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="WEIGHMENT">Weighment</option>
              </select>
            </div>
            
            <button
              onClick={fetchApprovalHistory}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No approval history found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timeline</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(request.type)}`}>
                      {request.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {renderApprovalDetails(request)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p><span className="font-medium">Created:</span> {formatDate(request.createdAt)}</p>
                      {request.status === 'APPROVED' && (
                        <p><span className="font-medium">Approved:</span> {formatDate(request.approvedAt)}</p>
                      )}
                      {request.status === 'REJECTED' && (
                        <p><span className="font-medium">Rejected:</span> {formatDate(request.rejectedAt)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {request.remarks || 'No remarks'}
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