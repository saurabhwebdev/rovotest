'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useSound from 'use-sound';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

interface TruckStatus {
  id: string;
  truckNumber: string;
  transporterName: string;
  status: string;
  location: string;
  lastUpdated: Date;
  dockName?: string;
  weighbridgeEntryId?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
}

// Dummy truck data to display when no real trucks are available
const dummyTrucks: TruckStatus[] = [
  {
    id: 'dummy-1',
    truckNumber: 'MH-01-AB-1234',
    transporterName: 'Express Logistics',
    status: 'LOADING_IN_PROGRESS',
    location: 'Dock 3',
    lastUpdated: new Date(),
    dockName: 'Dock 3',
    grossWeight: 12500,
    tareWeight: 5000,
    netWeight: 7500
  },
  {
    id: 'dummy-2',
    truckNumber: 'DL-02-CD-5678',
    transporterName: 'Fast Freight Services',
    status: 'WEIGHED',
    location: 'Weighbridge',
    lastUpdated: new Date(),
    grossWeight: 14200,
    tareWeight: 6100,
    netWeight: 8100
  },
  {
    id: 'dummy-3',
    truckNumber: 'KA-03-EF-9012',
    transporterName: 'Highway Carriers',
    status: 'PARKED',
    location: 'Parking Area B',
    lastUpdated: new Date()
  },
  // Add more dummy trucks for the same milestone to demonstrate the table view
  {
    id: 'dummy-4',
    truckNumber: 'TN-04-GH-3456',
    transporterName: 'South Carriers',
    status: 'PARKED',
    location: 'Parking Area B',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
  {
    id: 'dummy-5',
    truckNumber: 'GJ-05-IJ-7890',
    transporterName: 'Western Transport',
    status: 'PARKED',
    location: 'Parking Area B',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
  },
  {
    id: 'dummy-6',
    truckNumber: 'RJ-06-KL-1234',
    transporterName: 'Desert Logistics',
    status: 'WEIGHED',
    location: 'Weighbridge',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
  },
  {
    id: 'dummy-7',
    truckNumber: 'UP-07-MN-5678',
    transporterName: 'Northern Express',
    status: 'WEIGHED',
    location: 'Weighbridge',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 20) // 20 minutes ago
  }
];

export default function LEDScreen() {
  const [trucks, setTrucks] = useState<TruckStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [useDummyData, setUseDummyData] = useState(false);
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'single' | 'table'>('single');
  
  // Use the use-sound hook to play a "ding" sound
  const [playDing] = useSound('/sounds/ding.mp3', { volume: 0.5 });

  // Fetch LED screen settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const settingsRef = doc(db, 'settings', 'ledScreen');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setDemoModeEnabled(data.demoModeEnabled || false);
        } else {
          setDemoModeEnabled(false);
        }
      } catch (error) {
        console.error('Error fetching LED settings:', error);
        setDemoModeEnabled(false);
      }
    }

    fetchSettings();
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Update fullscreen state when it changes externally (like pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Hide navbar and other elements when in fullscreen mode
  useEffect(() => {
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const mainContainer = document.querySelector('main');
    const mainContent = document.querySelector('main > div');
    
    if (isFullscreen) {
      // Hide navbar, footer and any other UI elements
      if (navbar) navbar.style.display = 'none';
      if (footer) footer.style.display = 'none';
      
      // Remove padding and background from main container
      if (mainContainer) {
        mainContainer.classList.remove('container', 'px-4', 'py-6');
        mainContainer.classList.add('p-0', 'm-0');
      }
      
      if (mainContent) {
        mainContent.classList.remove('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-sm', 'p-6');
        mainContent.classList.add('p-0', 'm-0', 'bg-black');
      }
      
      // Add a class to the body to ensure full coverage
      document.body.classList.add('led-fullscreen-mode');
      
      // Add meta tags for fullscreen mode
      const metaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ];
      
      metaTags.forEach(meta => {
        let metaTag = document.querySelector(`meta[name="${meta.name}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('name', meta.name);
          metaTag.setAttribute('content', meta.content);
          document.head.appendChild(metaTag);
        }
      });
    } else {
      // Show navbar and footer when exiting fullscreen
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      
      // Restore padding and background to main container
      if (mainContainer) {
        mainContainer.classList.add('container', 'px-4', 'py-6');
        mainContainer.classList.remove('p-0', 'm-0');
      }
      
      if (mainContent) {
        mainContent.classList.add('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-sm', 'p-6');
        mainContent.classList.remove('p-0', 'm-0', 'bg-black');
      }
      
      // Remove the fullscreen class
      document.body.classList.remove('led-fullscreen-mode');
      
      // Remove meta tags
      ['apple-mobile-web-app-capable', 'mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style'].forEach(name => {
        const metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
          metaTag.remove();
        }
      });
    }
    
    return () => {
      // Cleanup when component unmounts
      document.body.classList.remove('led-fullscreen-mode');
      
      // Restore original classes
      if (mainContainer) {
        mainContainer.classList.add('container', 'px-4', 'py-6');
        mainContainer.classList.remove('p-0', 'm-0');
      }
      
      if (mainContent) {
        mainContent.classList.add('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-sm', 'p-6');
        mainContent.classList.remove('p-0', 'm-0', 'bg-black');
      }
      
      // Remove meta tags
      ['apple-mobile-web-app-capable', 'mobile-web-app-capable', 'apple-mobile-web-app-status-bar-style'].forEach(name => {
        const metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
          metaTag.remove();
        }
      });
    };
  }, [isFullscreen]);

  useEffect(() => {
    // Fetch truck data from Firestore
    const fetchTrucks = () => {
      const q = query(
        collection(db, 'plantTracking'),
        where('status', '!=', 'EXITED'),
        orderBy('status'),
        orderBy('lastUpdated', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const truckData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            truckNumber: data.truckNumber,
            transporterName: data.transporterName,
            status: data.status,
            location: data.location || 'Unknown',
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            dockName: data.dockName,
            weighbridgeEntryId: data.weighbridgeEntryId,
            grossWeight: data.grossWeight,
            tareWeight: data.tareWeight,
            netWeight: data.netWeight
          };
        });
        
        // If no real trucks are available, use dummy data only if demo mode is enabled
        if (truckData.length === 0 && demoModeEnabled) {
          setTrucks(dummyTrucks);
          setUseDummyData(true);
        } else if (truckData.length === 0) {
          setTrucks([]);
          setUseDummyData(false);
        } else {
          setTrucks(truckData);
          setUseDummyData(false);
        }
        
        setLoading(false);
      });
    };

    const unsubscribe = fetchTrucks();
    return () => unsubscribe();
  }, [demoModeEnabled]);

  // Group trucks by status and location
  const truckGroups = useMemo(() => {
    const groups: { [key: string]: TruckStatus[] } = {};
    
    trucks.forEach(truck => {
      const key = `${truck.status}_${truck.location}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(truck);
    });
    
    // Sort groups by number of trucks (descending)
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, trucks]) => ({
        key,
        status: trucks[0].status,
        location: trucks[0].location,
        trucks
      }));
  }, [trucks]);

  // Determine display mode based on truck density
  useEffect(() => {
    // If any group has more than 3 trucks, use table view
    const hasLargeGroup = truckGroups.some(group => group.trucks.length > 3);
    setDisplayMode(hasLargeGroup ? 'table' : 'single');
  }, [truckGroups]);

  // Rotate through truck groups with dynamic timing based on truck density
  useEffect(() => {
    if (truckGroups.length === 0) return;

    // Calculate rotation time based on number of trucks in the current group
    const getRotationTime = (index: number) => {
      const trucksInGroup = truckGroups[index].trucks.length;
      // More trucks = more time to view (20 seconds base for multiple trucks)
      return trucksInGroup > 3 ? 20000 : 12000;
    };

    const rotationTime = getRotationTime(currentIndex);
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % truckGroups.length;
        // Play the ding sound when changing groups
        playDing();
        return nextIndex;
      });
    }, rotationTime);

    return () => clearInterval(interval);
  }, [truckGroups.length, currentIndex, playDing]);

  // Get status color based on truck status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LOADING_IN_PROGRESS':
      case 'UNLOADING_IN_PROGRESS':
        return 'text-yellow-400';
      case 'WEIGHED':
      case 'READY_FOR_DOCK':
        return 'text-green-400';
      case 'PENDING_WEIGHING':
        return 'text-blue-400';
      case 'PARKED':
        return 'text-purple-400';
      case 'REJECTED':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  // Format the status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-4xl text-blue-500 font-mono">Loading...</div>
      </div>
    );
  }

  if (truckGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="text-4xl text-blue-500 font-mono mb-6">No trucks available</div>
        {!demoModeEnabled && (
          <div className="text-xl text-gray-400 font-mono">
            Demo mode is disabled. Contact an administrator to enable it.
          </div>
        )}
      </div>
    );
  }

  const currentGroup = truckGroups[currentIndex];
  const currentStatus = formatStatus(currentGroup.status);
  const currentLocation = currentGroup.location;
  const trucksInGroup = currentGroup.trucks;

  return (
    <PagePermissionWrapper pageId="led-screen">
      <div className={`min-h-screen bg-black text-white font-mono ${isFullscreen ? 'fixed inset-0 z-50 p-0' : 'p-8'} relative`}>
        {/* Fullscreen toggle button - always visible */}
        <button 
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 focus:outline-none"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          )}
        </button>

        <div className={`${isFullscreen ? 'pt-8' : 'mb-8'} text-center`}>
          <h1 className="text-6xl font-bold text-blue-500 mb-2">TRUCK STATUS BOARD</h1>
          <p className="text-2xl text-yellow-400">
            {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
          </p>
          {useDummyData && (
            <div className="mt-2 text-red-400 text-xl">
              * DEMO MODE - NO ACTIVE TRUCKS *
            </div>
          )}
        </div>

        <div className="bg-gray-900 border-2 border-blue-500 rounded-lg p-8 max-w-6xl mx-auto shadow-lg shadow-blue-500/50">
          {/* Group Header */}
          <div className="flex justify-between items-center border-b-2 border-blue-400 pb-4 mb-6">
            <div className="text-4xl font-bold">{currentLocation}</div>
            <div className={`text-3xl font-bold ${getStatusColor(currentGroup.status)}`}>
              {currentStatus}
            </div>
          </div>

          {/* Truck Display - Single or Table View based on truck density */}
          {trucksInGroup.length <= 3 ? (
            // Single truck view (or small group)
            <div className="grid grid-cols-1 gap-8">
              {trucksInGroup.map((truck, idx) => (
                <div key={truck.id} className={`${idx > 0 ? 'mt-8 pt-8 border-t border-gray-700' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-4xl font-bold">{truck.truckNumber}</div>
                    <div className="text-xl text-gray-400">
                      {truck.lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xl">
                    <div>
                      <p className="text-gray-400">Transporter</p>
                      <p className="text-2xl text-white">{truck.transporterName}</p>
                    </div>
                    
                    {truck.dockName && (
                      <div>
                        <p className="text-gray-400">Dock</p>
                        <p className="text-2xl text-white">{truck.dockName}</p>
                      </div>
                    )}
                    
                    {truck.grossWeight && (
                      <div>
                        <p className="text-gray-400">Weight</p>
                        <p className="text-2xl text-white">{truck.grossWeight} kg (Gross)</p>
                        {truck.netWeight && (
                          <p className="text-xl text-green-400">{truck.netWeight} kg (Net)</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Table view for larger groups
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-blue-400 border-b border-gray-700">
                    <th className="pb-3 text-xl">Truck Number</th>
                    <th className="pb-3 text-xl">Transporter</th>
                    {trucksInGroup.some(t => t.dockName) && (
                      <th className="pb-3 text-xl">Dock</th>
                    )}
                    {trucksInGroup.some(t => t.grossWeight) && (
                      <th className="pb-3 text-xl">Weight (kg)</th>
                    )}
                    <th className="pb-3 text-xl text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {trucksInGroup.map((truck) => (
                    <tr key={truck.id} className="border-b border-gray-800">
                      <td className="py-3 text-xl font-bold">{truck.truckNumber}</td>
                      <td className="py-3">{truck.transporterName}</td>
                      {trucksInGroup.some(t => t.dockName) && (
                        <td className="py-3">{truck.dockName || '-'}</td>
                      )}
                      {trucksInGroup.some(t => t.grossWeight) && (
                        <td className="py-3">
                          {truck.grossWeight ? (
                            <>
                              <span className="text-white">{truck.grossWeight} (G)</span>
                              {truck.netWeight && (
                                <span className="text-green-400 ml-2">{truck.netWeight} (N)</span>
                              )}
                            </>
                          ) : '-'}
                        </td>
                      )}
                      <td className="py-3 text-gray-400 text-right">
                        {truck.lastUpdated.toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Indicator */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-2">
            {truckGroups.map((_, index) => (
              <div 
                key={index} 
                className={`h-3 w-3 rounded-full ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'}`}
              />
            ))}
          </div>
          <p className="mt-2 text-gray-400">
            Showing {currentIndex + 1} of {truckGroups.length} groups | 
            {trucksInGroup.length} truck{trucksInGroup.length !== 1 ? 's' : ''} at {currentLocation}
          </p>
        </div>
        
        {/* Instructions for fullscreen - only show when not in fullscreen */}
        {!isFullscreen && (
          <div className="text-center mt-6 text-gray-500 text-sm">
            Click the <span className="text-blue-400">expand icon</span> in the top right corner for fullscreen mode
          </div>
        )}
      </div>
    </PagePermissionWrapper>
  );
} 