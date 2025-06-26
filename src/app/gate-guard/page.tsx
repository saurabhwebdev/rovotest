'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TruckVerificationList from '@/components/gate-guard/TruckVerificationList';
import QRScanner from '@/components/gate-guard/QRScanner';
import HelpIcon from '@/components/ui/HelpIcon';
import { gateGuardHelp } from '@/lib/helpContent';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function GateGuardDashboard() {
  const { user } = useAuth();
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);

  return (
    <PagePermissionWrapper pageId="gate-guard">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Gate Guard Portal</h1>
            <HelpIcon moduleHelp={gateGuardHelp} />
          </div>
          <button
            onClick={() => setShowQRScannerModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <TruckVerificationList />
        </div>

        {/* QR Scanner Modal */}
        {showQRScannerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-bold">Scan Truck QR Code</h2>
                <button 
                  onClick={() => setShowQRScannerModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <QRScanner onScanComplete={() => setShowQRScannerModal(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </PagePermissionWrapper>
  );
}