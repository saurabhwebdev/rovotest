import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Initialize Firebase Admin if not already initialized
    initAdmin();
    
    // Get Auth instance
    const auth = getAuth();
    
    // List users
    const listUsersResult = await auth.listUsers(1000);
    
    return NextResponse.json({ users: listUsersResult.users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
} 