'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  hasPermission: (pageId: string) => boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Check if the current user is logged in on mount
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? `User: ${currentUser.email}` : 'No user');
      setUser(currentUser);
      
      if (currentUser) {
        try {
          await fetchUserRole(currentUser.email);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
      setAuthInitialized(true);
      console.log("AuthProvider: Auth state initialized");
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRole = async (email: string | null) => {
    if (!email) return;
    
    console.log(`AuthProvider: Fetching role for user ${email}`);
    
    try {
      // Check if this is a master admin account first
      // If the current user is the master admin (based on email)
      if (email === 'admin@example.com' || email.includes('admin') || email === 'worlddj0@gmail.com') {
        console.log(`AuthProvider: Setting master admin role for ${email}`);
        setUserRole({
          id: 'admin-role',
          name: 'Administrator',
          permissions: ['*'] // Wildcard for all permissions
        });
        return;
      }

      // Find user in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log(`AuthProvider: Found user data:`, userData);
        
        if (userData.roleId) {
          // Fetch role details
          const roleRef = doc(db, 'roles', userData.roleId);
          const roleSnap = await getDoc(roleRef);
          
          if (roleSnap.exists()) {
            const roleData = roleSnap.data();
            console.log(`AuthProvider: Found role data:`, roleData);
            
            setUserRole({
              id: userData.roleId,
              name: roleData.name,
              permissions: roleData.permissions || []
            });
            return;
          }
        }
      }
      
      // If no specific role found, set a default role with dashboard access
      console.log(`AuthProvider: Setting default role with basic permissions for ${email}`);
      setUserRole({
        id: 'default-role',
        name: 'User',
        permissions: ['dashboard'] // Everyone gets dashboard access
      });
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const hasPermission = (pageId: string) => {
    // If auth is not initialized yet, don't make any permission decisions
    if (!authInitialized) {
      console.log(`AuthProvider: Auth not initialized yet, denying access to ${pageId}`);
      return false;
    }
    
    // If no user is logged in, no permissions
    if (!user) {
      console.log(`AuthProvider: No user logged in, denying access to ${pageId}`);
      return false;
    }
    
    // Dashboard should be accessible to all authenticated users
    if (pageId === 'dashboard') {
      console.log(`AuthProvider: Dashboard access granted to ${user.email}`);
      return true;
    }
    
    // Admin users identified by email have all permissions
    if (user.email && (user.email === 'admin@example.com' || user.email.includes('admin') || user.email === 'worlddj0@gmail.com')) {
      console.log(`AuthProvider: Admin user ${user.email} granted access to ${pageId} by email pattern`);
      return true;
    }
    
    // Check if user has wildcard permission
    if (userRole?.permissions?.includes('*')) {
      console.log(`AuthProvider: User ${user.email} has wildcard permission, granted access to ${pageId}`);
      return true;
    }
    
    // Check if user has the specific permission
    if (userRole?.permissions?.includes(pageId)) {
      console.log(`AuthProvider: User ${user.email} granted access to ${pageId} by explicit permission`);
      return true;
    }
    
    // If we get here, the user doesn't have permission
    console.log(`AuthProvider: User ${user.email} denied access to ${pageId} - no matching permission found`);
    console.log(`AuthProvider: User's permissions: ${userRole?.permissions?.join(', ') || 'none'}`);
    return false;
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    userRole,
    hasPermission,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}