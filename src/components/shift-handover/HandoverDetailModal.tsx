'use client';

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

interface HandoverDetailModalProps {
  record: HandoverRecord | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function HandoverDetailModal({ record, onClose, onUpdate }: HandoverDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  if (!record) return null;
  
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const markAsCompleted = async () => {
    if (!record) return;
    
    setIsUpdating(true);
    try {
      const handoverRef = doc(db, 'shiftHandovers', record.id);
      await updateDoc(handoverRef, {
        status: 'Completed',
        updatedAt: Timestamp.now()
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating handover status:', error);
      alert('Failed to update handover status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Shift Handover Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{record.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Shift Type</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{record.shiftType} Shift</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Handover Date</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{formatDate(record.handoverDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Handover Time</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{record.handoverTime}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Handed Over By</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{record.handoverBy}</p>
              {record.handoverByEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{record.handoverByEmail}</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Received By</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{record.receivedBy}</p>
              {record.receivedByEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{record.receivedByEmail}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-base">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  record.status === 'Completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {record.status}
                </span>
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Pending Tasks / Issues</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 whitespace-pre-wrap">
              {record.pendingTasks || 'No pending tasks recorded'}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Completed Tasks</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 whitespace-pre-wrap">
              {record.completedTasks || 'No completed tasks recorded'}
            </div>
          </div>
          
          {record.notes && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Additional Notes</h4>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 whitespace-pre-wrap">
                {record.notes}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          {record.status === 'Pending' && (
            <button
              onClick={markAsCompleted}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 mr-3"
            >
              {isUpdating ? 'Updating...' : 'Mark as Completed'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 