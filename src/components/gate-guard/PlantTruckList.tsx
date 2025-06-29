'use client';

import { useState, useEffect } from 'react';
import { getTrucksInsidePlant } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, onSnapshot, addDoc, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  currentLocation?: string;
  locationUpdatedAt?: string;
  locationUpdatedBy?: string;
  locationNotes?: string;
  weighbridgeId?: string;
}

interface Weighbridge {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export default function PlantTruckList() {
  const { user } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [selectedWeighbridge, setSelectedWeighbridge] = useState('');

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const trucksData = await getTrucksInsidePlant();
        console.log('Trucks inside plant:', trucksData);
        
        // Sort by location updated time
        const sortedTrucks = trucksData.sort((a, b) => {
          const dateA = new Date(a.locationUpdatedAt || a.createdAt).getTime();
          const dateB = new Date(b.locationUpdatedAt || b.createdAt).getTime();
          return dateB - dateA; // Most recent first
        });
        setTrucks(sortedTrucks as Truck[]);
        
        if (sortedTrucks.length === 0) {
          console.log('No trucks found in plant. Check if the truck status is one of: verified, at_parking, at_weighbridge, at_loading, at_unloading, in_plant, at_dock, inside_plant, inside-plant, in-plant');
        }
      } catch (err) {
        console.error('Error fetching trucks inside plant:', err);
        setError('Failed to load trucks inside plant');
      } finally {
        setLoading(false);
      }
    };

    fetchTrucks();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrucks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available weighbridges
  useEffect(() => {
    const fetchWeighbridges = async () => {
      const q = query(collection(db, 'weighbridges'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const weighbridgeData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Weighbridge[];
        setWeighbridges(weighbridgeData);
        
        // If there's only one active weighbridge, select it automatically
        const activeWeighbridge = weighbridgeData.find(wb => wb.isActive);
        if (activeWeighbridge) {
          setSelectedWeighbridge(activeWeighbridge.id);
        }
      });

      return () => unsubscribe();
    };

    fetchWeighbridges();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocationBadgeClass = (location: string, truck?: Truck) => {
    // First check the provided location
    switch (location?.toLowerCase()) {
      case 'parking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'weighbridge':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unloading':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'exit':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    // If no location, try to determine from status
    if (truck) {
      const status = truck.status?.toLowerCase() || '';
      if (status.includes('parking') || status === 'at_parking') 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      if (status.includes('weighbridge') || status === 'at_weighbridge') 
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      if (status.includes('loading') || status === 'at_loading') 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      if (status.includes('unloading') || status === 'at_unloading') 
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      if (status.includes('dock') || status === 'at_dock') 
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      if (status === 'verified') 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    // Default for inside plant
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  };

  const getLocationLabel = (location: string, truck?: Truck) => {
    // First check the provided location
    switch (location?.toLowerCase()) {
      case 'parking':
        return 'At Parking';
      case 'weighbridge':
        return 'At Weighbridge';
      case 'loading':
        return 'At Loading';
      case 'unloading':
        return 'At Unloading';
      case 'exit':
        return 'At Exit';
    }
    
    // If no location or 'unknown', try to determine from status
    if (!location || location === 'Unknown') {
      if (!truck) return 'Inside Plant';
      
      const status = truck.status?.toLowerCase() || '';
      if (status.includes('parking') || status === 'at_parking') return 'At Parking';
      if (status.includes('weighbridge') || status === 'at_weighbridge') return 'At Weighbridge';
      if (status.includes('loading') || status === 'at_loading') return 'At Loading';
      if (status.includes('unloading') || status === 'at_unloading') return 'At Unloading';
      if (status.includes('dock') || status === 'at_dock') return 'At Dock';
      if (status === 'verified') return 'At Gate';
      if (status.includes('inside') || status.includes('in_plant') || status.includes('in-plant')) return 'Inside Plant';
    }
    
    return location || 'Inside Plant';
  };

  const handleUpdateLocation = (truck: Truck) => {
    setSelectedTruck(truck);
    setNewLocation(truck.currentLocation || '');
    setLocationNotes('');
    setShowLocationModal(true);
  };

  const confirmLocationUpdate = async () => {
    if (!selectedTruck || !user || !newLocation) return;
    
    if (newLocation === 'weighbridge' && !selectedWeighbridge) {
      setError('Please select a weighbridge');
      return;
    }
    
    setUpdateLoading(true);
    try {
      const updateData: any = {
        currentLocation: newLocation,
        locationUpdatedAt: new Date().toISOString(),
        locationUpdatedBy: user.uid,
        locationNotes: locationNotes,
        status: newLocation === 'weighbridge' ? 'at_weighbridge' : 
               newLocation === 'parking' ? 'at_parking' :
               newLocation === 'loading' ? 'at_loading' :
               newLocation === 'unloading' ? 'at_unloading' :
               'in_plant'
      };

      if (newLocation === 'weighbridge') {
        updateData.weighbridgeId = selectedWeighbridge;
        
        // Create a new weighbridge entry
        const weighbridgeEntry = {
          truckNumber: selectedTruck.vehicleNumber,
          transporterName: selectedTruck.transporterName,
          status: 'PENDING_WEIGHING',
          inTime: Timestamp.now(),
          currentMilestone: 'PENDING_WEIGHING',
          truckId: selectedTruck.id,
          createdAt: Timestamp.now(),
          createdBy: user.uid
        };
        
        const weighbridgeEntryRef = await addDoc(collection(db, 'weighbridgeEntries'), weighbridgeEntry);
        updateData.weighbridgeEntryId = weighbridgeEntryRef.id;
      } else {
        // Clear weighbridge ID if moving to another location
        updateData.weighbridgeId = null;
        updateData.weighbridgeEntryId = null;
      }

      const truckRef = doc(db, 'trucks', selectedTruck.id);
      await updateDoc(truckRef, updateData);
      
      // Refresh the truck list
      const trucksData = await getTrucksInsidePlant();
      const sortedTrucks = trucksData.sort((a, b) => {
        const dateA = new Date(a.locationUpdatedAt || a.createdAt).getTime();
        const dateB = new Date(b.locationUpdatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
      setTrucks(sortedTrucks as Truck[]);
      
      setShowLocationModal(false);
    } catch (err) {
      console.error('Error updating truck location:', err);
      setError('Failed to update truck location');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredTrucks = trucks.filter(truck => {
    // Basic search filter
    const matchesSearch = 
      (truck.vehicleNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (truck.driverName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (truck.transporterName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Handle various location/status formats
    const truckLocation = truck.currentLocation?.toLowerCase() || '';
    const truckStatus = truck.status?.toLowerCase() || '';
    
    // Match location filter
    const matchesLocation = 
      filterLocation === 'all' || 
      truckLocation === filterLocation.toLowerCase() ||
      (filterLocation === 'weighbridge' && (truckStatus === 'at_weighbridge' || truckStatus.includes('weighbridge'))) ||
      (filterLocation === 'parking' && (truckStatus === 'at_parking' || truckStatus.includes('parking'))) ||
      (filterLocation === 'loading' && (truckStatus === 'at_loading' || truckStatus.includes('loading'))) ||
      (filterLocation === 'unloading' && (truckStatus === 'at_unloading' || truckStatus.includes('unloading')));
    
    return matchesSearch && matchesLocation;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search trucks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        
        <div className="flex items-center">
          <label htmlFor="locationFilter" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Location:
          </label>
          <select
            id="locationFilter"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800"
          >
            <option value="all">All Locations</option>
            <option value="parking">Parking</option>
            <option value="weighbridge">Weighbridge</option>
            <option value="loading">Loading</option>
            <option value="unloading">Unloading</option>
            <option value="exit">Exit</option>
          </select>
        </div>
      </div>

      {filteredTrucks.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">No trucks inside plant</h3>
          <p className="mt-2 text-gray-400">Trucks will appear here once they are processed and allowed inside the plant.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{truck.vehicleNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{truck.driverName}</div>
                    <div className="text-xs text-gray-500">{truck.mobileNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{truck.transporterName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLocationBadgeClass(truck.currentLocation || '', truck)}`}>
                      {getLocationLabel(truck.currentLocation || '', truck)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{formatDate(truck.locationUpdatedAt || truck.createdAt)}</div>
                    <div className="text-xs text-gray-500">{formatTime(truck.locationUpdatedAt || truck.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleUpdateLocation(truck)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Update Location
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Location Update Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Update Location</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Location
                </label>
                <select
                  value={newLocation}
                  onChange={(e) => {
                    setNewLocation(e.target.value);
                    if (e.target.value !== 'weighbridge') {
                      setSelectedWeighbridge('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a location...</option>
                  <option value="parking">Parking</option>
                  <option value="weighbridge">Weighbridge</option>
                  <option value="loading">Loading</option>
                  <option value="unloading">Unloading</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              {newLocation === 'weighbridge' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Weighbridge
                  </label>
                  <select
                    value={selectedWeighbridge}
                    onChange={(e) => setSelectedWeighbridge(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a weighbridge...</option>
                    {weighbridges
                      .filter(wb => wb.isActive)
                      .map(wb => (
                        <option key={wb.id} value={wb.id}>
                          {wb.name} - {wb.location}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={locationNotes}
                  onChange={(e) => setLocationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                         hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 
                         dark:hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmLocationUpdate}
                disabled={updateLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
                         hover:bg-blue-600 rounded-md disabled:opacity-50 
                         disabled:cursor-not-allowed"
              >
                {updateLoading ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}