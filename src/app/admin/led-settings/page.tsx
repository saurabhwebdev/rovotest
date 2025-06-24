'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function LEDSettingsPage() {
  const { user } = useAuth();
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsRef = doc(db, 'settings', 'ledScreen');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setDemoModeEnabled(data.demoModeEnabled || false);
          setRotationSpeed(data.rotationSpeed || 5);
        }
      } catch (error) {
        console.error('Error fetching LED settings:', error);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const settingsRef = doc(db, 'settings', 'ledScreen');
      await updateDoc(settingsRef, {
        demoModeEnabled,
        rotationSpeed,
        updatedAt: new Date(),
        updatedBy: user?.email
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving LED settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PagePermissionWrapper pageId="admin-led-settings">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">LED Screen Settings</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Display Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Demo Mode</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, shows sample data in the LED screen
                    </p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="demoMode" 
                      id="demoMode"
                      checked={demoModeEnabled}
                      onChange={() => setDemoModeEnabled(!demoModeEnabled)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label 
                      htmlFor="demoMode" 
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                        demoModeEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    ></label>
                  </div>
                </div>
                
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rotation Speed (seconds)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={rotationSpeed}
                      onChange={(e) => setRotationSpeed(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-gray-700 dark:text-gray-300 w-10 text-center">{rotationSpeed}s</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className={`px-4 py-2 rounded-md text-white ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              
              {saveSuccess && (
                <div className="ml-4 text-green-600 flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Settings saved successfully
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 