'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import ApprovalHistory from '@/components/ApprovalHistory';

interface ApprovalRequest {
  id: string;
  type: 'WEIGHMENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Timestamp;
  createdBy: string;
  data: {
    weighbridgeEntryId: string;
    truckNumber: string;
    transporterName: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    orderNumber: string;
    materialType: string;
  };
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  remarks?: string;
}

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    if (!user) return;
    fetchApprovalRequests();
  }, [user]);

  const fetchApprovalRequests = async () => {
    try {
      const q = query(
        collection(db, 'approvalRequests'),
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApprovalRequest[];
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      // Update approval request
      await updateDoc(doc(db, 'approvalRequests', request.id), {
        status: 'APPROVED',
        approvedAt: Timestamp.now(),
        approvedBy: user?.uid,
        remarks: remarks
      });

      // Update weighbridge entry
      await updateDoc(doc(db, 'weighbridgeEntries', request.data.weighbridgeEntryId), {
        grossWeight: request.data.grossWeight,
        tareWeight: request.data.tareWeight,
        netWeight: request.data.netWeight,
        orderNumber: request.data.orderNumber,
        materialType: request.data.materialType,
        weighingTime: Timestamp.now(),
        status: 'WEIGHED',
        currentMilestone: 'WEIGHED',
        approvedAt: Timestamp.now(),
        approvedBy: user?.uid
      });

      setRemarks('');
      setSelectedRequest(null);
      fetchApprovalRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    if (!remarks) {
      alert('Please provide remarks for rejection');
      return;
    }

    try {
      // Update approval request
      await updateDoc(doc(db, 'approvalRequests', request.id), {
        status: 'REJECTED',
        rejectedAt: Timestamp.now(),
        rejectedBy: user?.uid,
        remarks: remarks
      });

      // Update weighbridge entry
      await updateDoc(doc(db, 'weighbridgeEntries', request.data.weighbridgeEntryId), {
        status: 'WEIGHING_REJECTED',
        currentMilestone: 'PENDING_WEIGHING',
        rejectedAt: Timestamp.now(),
        rejectedBy: user?.uid,
        rejectionRemarks: remarks
      });

      setRemarks('');
      setSelectedRequest(null);
      fetchApprovalRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Approval History
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'pending' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Pending Approvals</h1>

          {loading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No pending approval requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {request.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.data.truckNumber} - {request.data.transporterName}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            Order: {request.data.orderNumber}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            Net Weight: {request.data.netWeight} kg
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            (Gross: {request.data.grossWeight} kg, Tare: {request.data.tareWeight} kg)
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.createdAt.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {selectedRequest === request.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder="Enter remarks..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(request)}
                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setRemarks('');
                                }}
                                className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedRequest(request.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <ApprovalHistory />
      )}
    </div>
  );
}
