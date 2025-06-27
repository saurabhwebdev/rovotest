'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  getDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser, 
  getAuth, 
  updateEmail, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

interface User {
  id: string;
  email: string;
  displayName?: string;
  roleId?: string;
  roleName?: string;
  createdAt?: any;
  provider?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface FirebaseAuthUser {
  email: string;
  uid: string;
  displayName: string | null;
  metadata: {
    creationTime: string;
  };
  providerData: Array<{
    providerId: string;
  }>;
}

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchRoles();
    }
  }, [user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get all users from Firestore
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const firestoreUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      // Get all users from Firebase Auth
      const auth = getAuth();
      const listUsersPage = await fetch('/api/list-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const authUsers = await listUsersPage.json();

      // Merge users from both sources
      const mergedUsers = authUsers.users.map((authUser: FirebaseAuthUser) => {
        const firestoreUser = firestoreUsers.find(fu => fu.email === authUser.email);
        return {
          id: firestoreUser?.id || authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName || firestoreUser?.displayName || '',
          roleId: firestoreUser?.roleId || '',
          provider: authUser.providerData[0]?.providerId || 'email',
          createdAt: firestoreUser?.createdAt || authUser.metadata.creationTime
        };
      });

      // Fetch role names for each user
      const usersWithRoles = await Promise.all(
        mergedUsers.map(async (user) => {
          if (user.roleId) {
            try {
              const roleDoc = await getDoc(doc(db, 'roles', user.roleId));
              if (roleDoc.exists()) {
                return {
                  ...user,
                  roleName: roleDoc.data().name
                };
              }
            } catch (error) {
              console.error('Error fetching role:', error);
            }
          }
          return user;
        })
      );
      
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesCollection = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesCollection);
      const rolesList = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role));
      setRoles(rolesList);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleAddUser = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setError('');
    setSuccessMessage('');
    
    try {
      // Create user in Firebase Authentication
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Create user profile in Firestore
      const userData = {
        email: email,
        displayName: displayName || '',
        roleId: selectedRole || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.email || 'admin'
      };
      
      await addDoc(collection(db, 'users'), {
        uid: newUser.uid,
        ...userData
      });
      
      setSuccessMessage('User created successfully');
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser || !email.trim()) {
      setError('Email is required');
      return;
    }

    setError('');
    setSuccessMessage('');
    
    try {
      // Update user in Firestore
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        email: email,
        displayName: displayName || '',
        roleId: selectedRole || null,
        updatedAt: new Date()
      });
      
      setSuccessMessage('User updated successfully');
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setSuccessMessage('User deleted successfully');
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setError(error.message || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    if (confirm(`Are you sure you want to send a password reset email to ${userEmail}?`)) {
      try {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, userEmail);
        setSuccessMessage('Password reset email sent successfully');
      } catch (error: any) {
        console.error('Error sending password reset:', error);
        setError(error.message || 'Failed to send password reset email');
      }
    }
  };

  const editUser = (user: User) => {
    setCurrentUser(user);
    setEmail(user.email);
    setDisplayName(user.displayName || '');
    setSelectedRole(user.roleId || '');
    setIsEditingUser(true);
    setIsAddingUser(true);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSelectedRole('');
    setCurrentUser(null);
    setIsAddingUser(false);
    setIsEditingUser(false);
  };

  const handleUpdateUserRole = async (userId: string, email: string, newRoleId: string) => {
    try {
      setError('');
      setSuccessMessage('');

      // Check if user already has a Firestore record
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new user record in Firestore
        await addDoc(collection(db, 'users'), {
          email: email,
          roleId: newRoleId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user?.email || 'admin'
        });
      } else {
        // Update existing user record
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          roleId: newRoleId,
          updatedAt: new Date()
        });
      }

      setSuccessMessage('User role updated successfully');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role');
    }
  };

  return (
    <PagePermissionWrapper pageId="admin-user-management">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        {!isAddingUser ? (
          <div className="mb-6">
            <button
              onClick={() => setIsAddingUser(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Add New User
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter email"
                  disabled={isEditingUser}
                />
              </div>
              
              {!isEditingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter password"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter display name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assign Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">No Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={isEditingUser ? handleUpdateUser : handleAddUser}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  {isEditingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              Existing Users
            </h3>
          </div>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No users found. Create your first user.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Display Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Provider
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.displayName || 'No display name'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.roleName || 'No role assigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.provider || 'email'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => editUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.email)}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 mr-3"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 