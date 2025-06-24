'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  displayName?: string;
  roleId?: string;
  roleName?: string;
}

interface NewHandoverModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewHandoverModal({ onClose, onSuccess }: NewHandoverModalProps) {
  const { user } = useAuth();
  
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

  // User selection states
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
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
    fetchUsers();
    
    // Initialize date with today's date
    const today = new Date();
    setHandoverDate(today.toISOString().split('T')[0]);

    // Initialize time with current time
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    setHandoverTime(`${hours}:${minutes}`);
  }, []);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          (user.displayName?.toLowerCase().includes(query) || false) ||
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleUserSelect = (selectedUser: User) => {
    setReceivedBy(selectedUser.displayName || selectedUser.email);
    setReceivedByEmail(selectedUser.email);
    setShowUserDropdown(false);
    setSearchQuery('');
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
        handoverBy: user.displayName || user.email || '',
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
      onSuccess();
      alert('Shift handover record submitted successfully');
    } catch (error) {
      console.error('Error adding handover record:', error);
      alert('Failed to submit handover record');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Handover
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
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Received By*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Search by name or email"
                    required={receivedBy === ''}
                  />
                  
                  {/* Display the selected user if any */}
                  {receivedBy && (
                    <div className="mt-2 flex items-center bg-indigo-100 dark:bg-indigo-900 rounded-md p-2">
                      <span className="flex-grow">{receivedBy}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setReceivedBy('');
                          setReceivedByEmail('');
                          setSearchQuery('');
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Dropdown for users */}
                  {showUserDropdown && searchQuery && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md max-h-60 overflow-auto">
                      {filteredUsers.length > 0 ? (
                        <ul className="py-1">
                          {filteredUsers.map((user) => (
                            <li 
                              key={user.id}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="font-medium">{user.displayName || user.email}</div>
                              {user.displayName && <div className="text-sm text-gray-500">{user.email}</div>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                      )}
                    </div>
                  )}
                </div>
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
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Submit Handover
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 