'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LEDSettings() {
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, router]);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsRef = doc(db, 'settings', 'ledScreen');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setDemoModeEnabled(data.demoModeEnabled || false);
        } else {
          // Create default settings if they don't exist
          await setDoc(doc(db, 'settings', 'ledScreen'), {
            demoModeEnabled: false,
            lastUpdated: new Date(),
            updatedBy: user?.email || 'system'
          });
        }
      } catch (error) {
        console.error('Error fetching LED settings:', error);
        setMessage({ 
          text: 'Failed to load settings. Please try again.', 
          type: 'error' 
        });
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSettings();
    }
  }, [user]);

  // Save settings
  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      await setDoc(doc(db, 'settings', 'ledScreen'), {
        demoModeEnabled,
        lastUpdated: new Date(),
        updatedBy: user.email
      });
      
      setMessage({ 
        text: 'Settings saved successfully!', 
        type: 'success' 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Error saving LED settings:', error);
      setMessage({ 
        text: 'Failed to save settings. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">LED Screen Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
        
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-medium">Demo Mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              When enabled, the LED screen will show dummy truck data when no real trucks are available
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={demoModeEnabled}
              onChange={() => setDemoModeEnabled(!demoModeEnabled)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {demoModeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
} 