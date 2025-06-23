'use client';

import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

// Generic function to get a document by ID
export async function getDocument(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

// Generic function to get all documents in a collection
export async function getCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Generic function to add a document to a collection
export async function addDocument(collectionName: string, data: any) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

// Generic function to update a document
export async function updateDocument(collectionName: string, id: string, data: any) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
  return true;
}

// Generic function to delete a document
export async function deleteDocument(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return true;
}

// Function to get documents with a specific field value
export async function getDocumentsWhere(
  collectionName: string, 
  field: string, 
  operator: any, 
  value: any
) {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Function to get documents with ordering and limit
export async function getDocumentsOrdered(
  collectionName: string,
  orderByField: string,
  direction: 'asc' | 'desc' = 'desc',
  limitCount: number = 10
) {
  const q = query(
    collection(db, collectionName),
    orderBy(orderByField, direction),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// User-specific functions
export async function getUserProfile(userId: string) {
  return getDocument('users', userId);
}

export async function createUserProfile(userId: string, data: any) {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return true;
}

export async function updateUserProfile(userId: string, data: any) {
  return updateDocument('users', userId, data);
}

// Truck-related functions
export async function getTruckById(truckId: string) {
  return getDocument('trucks', truckId);
}

export async function getTrucksByStatus(status: string) {
  return getDocumentsWhere('trucks', 'status', '==', status);
}

export async function updateTruckStatus(truckId: string, status: string, verificationData?: any) {
  const updateData: any = {
    status,
    updatedAt: serverTimestamp()
  };
  
  if (status === 'verified') {
    updateData.verifiedAt = serverTimestamp();
  }
  
  if (verificationData) {
    updateData.verificationData = verificationData;
  }
  
  // If this is a truck that was previously pending approval and is now being verified,
  // we want to preserve the approval data but update the status
  if (status === 'verified') {
    try {
      // First get the current truck data
      const currentTruck = await getTruckById(truckId) as any;
      
      // If this was a truck that was pending approval
      if (currentTruck && currentTruck.status === 'pending-approval') {
        console.log('Verifying a previously pending approval truck:', truckId);
      }
    } catch (err) {
      console.error('Error checking current truck status:', err);
    }
  }
  
  return updateDocument('trucks', truckId, updateData);
}

export async function sendTruckForApproval(truckId: string, userId: string, failedChecks: string[], approvalReason: string, verificationData?: any) {
  const updateData: any = {
    status: 'pending-approval',
    approvalStatus: 'pending',
    approvalRequestedAt: serverTimestamp(),
    approvalRequestedBy: userId,
    failedChecks: failedChecks,
    approvalNotes: approvalReason,
    updatedAt: serverTimestamp()
  };
  
  if (verificationData) {
    updateData.verificationData = verificationData;
  }
  
  return updateDocument('trucks', truckId, updateData);
}

export async function updateTruckLocation(
  truckId: string, 
  location: string, 
  userId: string, 
  notes?: string,
  weighbridgeId?: string
) {
  const truckRef = doc(db, 'trucks', truckId);
  const updateData: any = {
    currentLocation: location,
    locationUpdatedAt: serverTimestamp(),
    locationUpdatedBy: userId,
    locationNotes: notes || null,
    status: location === 'weighbridge' ? 'at_weighbridge' : 'at_' + location
  };

  if (location === 'weighbridge') {
    updateData.weighbridgeId = weighbridgeId;
    updateData.source = 'parking';
  } else {
    // Clear weighbridge ID if moving to another location
    updateData.weighbridgeId = null;
  }

  await updateDoc(truckRef, updateData);
}

export async function getTrucksInsidePlant() {
  const q = query(
    collection(db, 'trucks'),
    where('status', 'in', ['verified', 'at_parking', 'at_weighbridge', 'at_loading', 'at_unloading'])
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    locationUpdatedAt: doc.data().locationUpdatedAt?.toDate?.() || doc.data().locationUpdatedAt,
  }));
}

export async function getScheduledTrucksForDate(date: string) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const q = query(
    collection(db, 'trucks'),
    where('reportingDate', '>=', startOfDay.toISOString().split('T')[0]),
    where('reportingDate', '<=', endOfDay.toISOString().split('T')[0]),
    where('status', '==', 'scheduled')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Function to get all trucks pending approval
export async function getTrucksPendingApproval() {
  return getDocumentsWhere('trucks', 'status', '==', 'pending-approval');
}

// Function to approve a truck that was sent for approval
export async function approveTruckRequest(truckId: string, userId: string, approvalNotes: string) {
  const updateData: any = {
    approvalStatus: 'approved',
    approvalResolvedAt: serverTimestamp(),
    approvalResolvedBy: userId,
    approvalNotes: approvalNotes,
    updatedAt: serverTimestamp()
  };
  
  try {
    // First update the approval status
    await updateDocument('trucks', truckId, updateData);
    
    // Then fetch the document to verify the update
    const truck = await getTruckById(truckId) as any;
    
    if (truck) {
      console.log('Truck approval status updated:', truck.approvalStatus);
    } else {
      console.error('Could not find truck after updating approval status');
    }
    
    return true;
  } catch (error) {
    console.error('Error approving truck request:', error);
    throw error;
  }
}

// Function to reject a truck approval request
export async function rejectTruckRequest(truckId: string, userId: string, rejectionNotes: string) {
  const updateData: any = {
    approvalStatus: 'rejected',
    approvalResolvedAt: serverTimestamp(),
    approvalResolvedBy: userId,
    approvalNotes: rejectionNotes,
    status: 'rejected',
    updatedAt: serverTimestamp()
  };
  
  return updateDocument('trucks', truckId, updateData);
}