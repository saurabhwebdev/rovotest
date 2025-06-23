'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getDocument } from '@/lib/firestore';
import TruckVerificationModal from './TruckVerificationModal';

interface Truck {
  id: string;
  driverName: string;
  mobileNumber: string;
  licenseNumber: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  gate: string;
  status: string;
  createdAt: string;
}

interface QRScannerProps {
  onScanComplete?: () => void;
}

export default function QRScanner({ onScanComplete }: QRScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [foundTruck, setFoundTruck] = useState<Truck | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  // Initialize scanner on mount
  useEffect(() => {
    let mounted = true;

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mounted) return;
      
      try {
        if (!scannerRef.current && document.getElementById(scannerDivId)) {
          scannerRef.current = new Html5Qrcode(scannerDivId);
          setScannerReady(true);
        }
      } catch (error) {
        console.error('Error initializing scanner:', error);
        setError('Could not initialize camera scanner. Please try again.');
      }
    }, 500);

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timer);
      
      // Stop the scanner if it's running
      if (scannerRef.current) {
        if (scanning) {
          scannerRef.current.stop()
            .catch(err => console.error('Error stopping scanner:', err))
            .finally(() => {
              scannerRef.current = null;
            });
        } else {
          scannerRef.current = null;
        }
      }
    };
  }, []);

  // Handle scanning state changes
  useEffect(() => {
    if (!scanning && scannerRef.current) {
      // If we've stopped scanning, make sure the scanner is stopped
      scannerRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
    }
  }, [scanning]);

  const startScanner = async () => {
    if (!scannerRef.current || !scannerReady) {
      setError('Scanner not ready. Please refresh the page and try again.');
      return;
    }
    
    setError('');
    setScanning(true);
    setFoundTruck(null);
    
    try {
      const config = {
        fps: 5, // Lower FPS for more reliable scanning
        qrbox: { width: 250, height: 250 },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ],
        rememberLastUsedCamera: true,
      };
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Could not start camera. Please check permissions and try again.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current || !scanning) return;
    
    try {
      await scannerRef.current.stop();
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    console.log('QR Code detected:', decodedText);
    await stopScanner();
    
    // Try to parse the QR code content if it's JSON
    let truckId = decodedText;
    try {
      // Check if the QR code content is a JSON string with an ID field
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.id) {
        truckId = parsed.id;
      }
    } catch (e) {
      // If it's not JSON, use the raw string as the ID
      console.log('QR code content is not JSON, using as plain ID');
    }
    
    await lookupTruck(truckId);
  };

  const onScanFailure = (error: any) => {
    // Don't show errors on each frame, that would be too noisy
    // Only log specific types of errors
    if (error && typeof error === 'object' && error.message) {
      if (error.message.includes('NotFoundException')) {
        // This is a common error when no QR code is found, we can ignore it
        return;
      }
      console.error('QR code scan error:', error);
    }
  };

  const lookupTruck = async (truckId: string) => {
    setLoading(true);
    setError('');
    
    try {
      const truck = await getDocument('trucks', truckId) as Truck | null;
      
      if (!truck) {
        setError('Truck not found. Please check the QR code and try again.');
        setFoundTruck(null);
        return;
      }
      
      if (truck.status !== 'scheduled') {
        setError(`This truck is already ${truck.status}. Only scheduled trucks can be verified.`);
        setFoundTruck(null);
        return;
      }
      
      setFoundTruck(truck);
      setShowVerificationModal(true);
    } catch (err) {
      console.error('Error looking up truck:', err);
      setError('Failed to look up truck information');
      setFoundTruck(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEntry.trim()) return;
    
    await lookupTruck(manualEntry.trim());
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Scan QR Code</h2>
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ height: "280px" }}>
            <div id={scannerDivId} className="w-full h-full"></div>
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Camera preview will appear here</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-3">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Start Camera
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Stop Camera
              </button>
            )}
          </div>
          
          {scanning && (
            <p className="mt-2 text-xs text-gray-500">
              Position the QR code within the scanning area. If you're having trouble, try adjusting the lighting or distance.
            </p>
          )}
        </div>
        
        {/* Manual Entry */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Enter Truck ID Manually</h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-[280px] flex flex-col justify-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If the QR code is damaged or not scanning properly, you can enter the truck ID manually below.
              </p>
              <form onSubmit={handleManualSearch} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  placeholder="Enter truck ID..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Verification Modal */}
      {showVerificationModal && foundTruck && (
        <TruckVerificationModal 
          truck={foundTruck} 
          onClose={() => setShowVerificationModal(false)}
          onVerificationComplete={() => {
            setShowVerificationModal(false);
            setFoundTruck(null);
            if (onScanComplete) {
              onScanComplete();
            }
          }}
        />
      )}
    </div>
  );
} 