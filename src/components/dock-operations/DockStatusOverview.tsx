'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Clock, Truck, ArrowUpDown, ChevronDown, ChevronUp, PanelRightOpen, PanelRightClose, ArrowDownCircle, ArrowUpCircle, Activity, Info } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { AnimatePresence, motion } from 'framer-motion';

interface DockStatus {
  totalDocks: number;
  occupiedDocks: number;
  emptyDocks: number;
  averageOperationTime: number;
  averageUtilization: number;
}

interface Dock {
  id: string;
  name: string;
  isActive: boolean;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
  capacity: number;
  location: string;
  status: 'FREE' | 'OCCUPIED' | 'INACTIVE';
  truckNumber?: string;
  operationType?: 'LOADING' | 'UNLOADING';
}

export default function DockStatusOverview() {
  const [status, setStatus] = useState<DockStatus>({
    totalDocks: 0,
    occupiedDocks: 0,
    emptyDocks: 0,
    averageOperationTime: 0,
    averageUtilization: 0,
  });
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isKpiExpanded, setIsKpiExpanded] = useState(false);
  const [isDockViewExpanded, setIsDockViewExpanded] = useState(false);
  const [selectedDock, setSelectedDock] = useState<Dock | null>(null);

  useEffect(() => {
    fetchDockStatus();
    const interval = setInterval(fetchDockStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load expansion state from localStorage on mount
  useEffect(() => {
    const savedKpiState = localStorage.getItem('dockKpiExpanded');
    const savedDockViewState = localStorage.getItem('dockViewExpanded');
    
    if (savedKpiState !== null) {
      setIsKpiExpanded(savedKpiState === 'true');
    }
    
    if (savedDockViewState !== null) {
      setIsDockViewExpanded(savedDockViewState === 'true');
    }
  }, []);

  const toggleKpiExpanded = () => {
    const newState = !isKpiExpanded;
    setIsKpiExpanded(newState);
    localStorage.setItem('dockKpiExpanded', newState.toString());
  };

  const toggleDockViewExpanded = () => {
    const newState = !isDockViewExpanded;
    setIsDockViewExpanded(newState);
    localStorage.setItem('dockViewExpanded', newState.toString());
  };

  const fetchDockStatus = async () => {
    try {
      // Get all docks
      const docksSnapshot = await getDocs(collection(db, 'docks'));
      const docksData = docksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isActive ? 'FREE' : 'INACTIVE',
      })) as Dock[];
      
      // Get active dock operations
      const activeOpsQuery = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'IN_PROGRESS')
      );
      const activeOpsSnapshot = await getDocs(activeOpsQuery);
      
      // Update docks with operation status
      const docksWithStatus = [...docksData];
      activeOpsSnapshot.forEach(opDoc => {
        const opData = opDoc.data();
        const dockIndex = docksWithStatus.findIndex(d => d.id === opData.dockId);
        if (dockIndex !== -1) {
          docksWithStatus[dockIndex].status = 'OCCUPIED';
          docksWithStatus[dockIndex].truckNumber = opData.truckNumber;
          docksWithStatus[dockIndex].operationType = opData.operationType;
        }
      });
      
      // Sort docks by name numerically
      const sortedDocks = docksWithStatus.sort((a, b) => {
        // Extract numbers from dock names for numeric sorting
        const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
        const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
        return aNum - bNum;
      });
      
      setDocks(sortedDocks);
      
      const totalDocks = docksData.length;
      const occupiedDocks = activeOpsSnapshot.size;
      const inactiveDocks = docksData.filter(dock => !dock.isActive).length;
      const emptyDocks = totalDocks - occupiedDocks - inactiveDocks;

      // Get completed operations from last 24 hours for average time calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const completedOpsQuery = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'COMPLETED'),
        where('endTime', '>=', yesterday)
      );
      const completedOpsSnapshot = await getDocs(completedOpsQuery);
      
      let totalTime = 0;
      completedOpsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const duration = data.endTime.toDate().getTime() - data.startTime.toDate().getTime();
        totalTime += duration;
      });

      const averageTime = completedOpsSnapshot.size > 0 
        ? totalTime / completedOpsSnapshot.size / (1000 * 60) // Convert to minutes
        : 0;

      // Calculate utilization (operations completed / total possible operations in 24h)
      const maxOperationsPerDock = 24 * 60 / averageTime; // Theoretical max operations per dock in 24h
      const actualOperations = completedOpsSnapshot.size;
      const utilization = (actualOperations / (maxOperationsPerDock * totalDocks)) * 100;

      setStatus({
        totalDocks,
        occupiedDocks,
        emptyDocks,
        averageOperationTime: Math.round(averageTime),
        averageUtilization: Math.round(utilization),
      });
    } catch (error) {
      console.error('Error fetching dock status:', error);
    }
  };

  // Determine grid layout based on number of docks
  const getGridColumns = () => {
    const count = docks.length;
    if (count <= 10) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    if (count <= 20) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";
    if (count <= 30) return "grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10";
    return "grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12";
  };

  // Determine card size based on number of docks
  const getCardSize = () => {
    const count = docks.length;
    if (count <= 12) return ""; // Default size
    if (count <= 24) return "scale-95";
    if (count <= 36) return "scale-90";
    return "scale-85";
  };

  // Function to get status color based on dock status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FREE':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          border: 'border-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-300',
          gradient: 'from-emerald-500 to-green-500',
          icon: 'text-emerald-500'
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-blue-600 dark:bg-blue-700',
          border: 'border-blue-500',
          text: 'text-white dark:text-white',
          gradient: 'from-blue-500 to-cyan-500',
          icon: 'text-white'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          border: 'border-gray-400',
          text: 'text-gray-500 dark:text-gray-400',
          gradient: 'from-gray-500 to-gray-400',
          icon: 'text-gray-500'
        };
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* KPI Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200"
          onClick={toggleKpiExpanded}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className={`mr-2 transition-all duration-300 ${isKpiExpanded ? 'text-blue-500 rotate-180' : 'text-gray-400'}`}>
              <ChevronDown className="h-5 w-5" />
            </div>
            Dock KPI Overview
          </h3>
          <button 
            className={`p-1.5 rounded-full transition-all duration-200 ${
              isKpiExpanded 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300 rotate-0' 
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rotate-180'
            }`}
            aria-label={isKpiExpanded ? "Collapse" : "Expand"}
          >
            <ArrowUpCircle className="h-5 w-5 transition-transform duration-300" />
          </button>
        </div>
        
        <AnimatePresence initial={false}>
          {isKpiExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <Card className="p-4 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900 hover:shadow-md transition-all duration-200 border-l-4 border-blue-500">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Docks</h3>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                        <AnimatedCounter end={status.totalDocks} duration={1} />
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <Card className="p-4 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900 hover:shadow-md transition-all duration-200 border-l-4 border-green-500">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Available Docks</h3>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-300">
                        <AnimatedCounter end={status.emptyDocks} duration={1} />
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Card className="p-4 flex flex-col items-center justify-center bg-yellow-50 dark:bg-yellow-900 hover:shadow-md transition-all duration-200 border-l-4 border-yellow-500">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Occupied Docks</h3>
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
                        <AnimatedCounter end={status.occupiedDocks} duration={1} />
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    <Card className="p-4 flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900 hover:shadow-md transition-all duration-200 border-l-4 border-purple-500">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Avg. Operation Time</h3>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-300" />
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                          <AnimatedCounter end={status.averageOperationTime} duration={1} suffix=" min" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <Card className="p-4 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900 hover:shadow-md transition-all duration-200 border-l-4 border-red-500">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Dock Utilization</h3>
                      <div className="flex items-center">
                        <ArrowUpDown className="w-5 h-5 mr-2 text-red-600 dark:text-red-300" />
                        <div className="text-2xl font-bold text-red-600 dark:text-red-300">
                          <AnimatedCounter end={status.averageUtilization} duration={1} suffix="%" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Dock Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200"
          onClick={toggleDockViewExpanded}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className={`mr-2 transition-all duration-300 ${isDockViewExpanded ? 'text-blue-500 rotate-180' : 'text-gray-400'}`}>
              <ChevronDown className="h-5 w-5" />
            </div>
            Dock Status Overview
          </h3>
          <div className="flex items-center">
            {/* Summary indicators, always visible */}
            <div className="hidden sm:flex items-center mr-4 space-x-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{status.emptyDocks}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{status.occupiedDocks}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-500 mr-1.5"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {status.totalDocks - status.emptyDocks - status.occupiedDocks}
                </span>
              </div>
            </div>
            <button 
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isDockViewExpanded 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300 rotate-0' 
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rotate-180'
              }`}
              aria-label={isDockViewExpanded ? "Collapse" : "Expand"}
            >
              <ArrowUpCircle className="h-5 w-5 transition-transform duration-300" />
            </button>
          </div>
        </div>
        
        <AnimatePresence initial={false}>
          {isDockViewExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Selected Dock Detail Card */}
              {selectedDock && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="m-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {selectedDock.name}
                      </h3>
                      <div className="flex items-center mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedDock.status === 'FREE' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' 
                            : selectedDock.status === 'OCCUPIED' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {selectedDock.status === 'FREE' 
                            ? 'Available' 
                            : selectedDock.status === 'OCCUPIED' 
                              ? 'In Use' 
                              : 'Inactive'
                          }
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{selectedDock.type} Dock</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDock(null);
                      }}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</h4>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedDock.location || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">Capacity</h4>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedDock.capacity} Truck(s)</p>
                    </div>
                  </div>
                  
                  {selectedDock.status === 'OCCUPIED' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Operation</h4>
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span className="text-sm font-medium text-white dark:text-white">{selectedDock.truckNumber}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                        <Activity className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span className="text-sm font-medium text-white dark:text-white">{selectedDock.operationType || 'Operation'}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              
              <div className="p-4 sm:p-6">
                {/* Modern dock grid layout - adaptive based on count */}
                <div className={`grid ${getGridColumns()} gap-2 sm:gap-3 md:gap-4`}>
                  {docks.map((dock, index) => {
                    const colorScheme = getStatusColor(dock.status);
                    return (
                      <motion.div 
                        key={dock.id} 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.01, 0.5), duration: 0.3 }}
                        onClick={() => setSelectedDock(dock)}
                        className={`relative overflow-hidden rounded-lg border ${colorScheme.border} ${colorScheme.bg} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${getCardSize()}`}
                      >
                        {/* Top status bar */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${colorScheme.gradient}`}></div>
                        
                        {/* Animated pulse for occupied docks */}
                        {dock.status === 'OCCUPIED' && (
                          <div className="absolute inset-0 bg-blue-500 animate-pulse opacity-5"></div>
                        )}
                        
                        <div className="p-2">
                          {/* Dock name and status */}
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`text-xs font-semibold ${dock.status === 'OCCUPIED' ? 'text-white dark:text-white' : 'text-gray-900 dark:text-gray-100'} truncate pr-1`} title={dock.name}>
                              {dock.name}
                            </h3>
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              dock.status === 'FREE' 
                                ? 'bg-emerald-500' 
                                : dock.status === 'OCCUPIED' 
                                  ? 'bg-white animate-pulse' 
                                  : 'bg-gray-400'
                            }`}></div>
                          </div>
                          
                          {/* Truck info if occupied - only show on larger cards or hover */}
                          {dock.status === 'OCCUPIED' && (
                            <div className="flex items-center text-xs text-white dark:text-white mt-1 truncate font-medium">
                              <Truck className="w-3 h-3 mr-1 flex-shrink-0 text-white" />
                              <span className="truncate text-[10px]" title={dock.truckNumber}>
                                {dock.truckNumber}
                              </span>
                            </div>
                          )}
                          
                          {/* View details indicator - simplified */}
                          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Info className={`w-3 h-3 ${colorScheme.icon}`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Dock count information */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3 text-center">
                  Showing {docks.length} docks • {status.emptyDocks} available • {status.occupiedDocks} in use • {status.totalDocks - status.emptyDocks - status.occupiedDocks} inactive
                </div>
                
                {/* Legend */}
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex flex-wrap gap-4 mt-3 justify-center text-xs"
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></div>
                    <span className="text-gray-700 dark:text-gray-300">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5 animate-pulse"></div>
                    <span className="text-gray-700 dark:text-gray-300">In Use</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-400 mr-1.5"></div>
                    <span className="text-gray-700 dark:text-gray-300">Inactive</span>
                  </div>
                  <div className="flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                    <Info className="w-3 h-3 mr-1.5 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Click for details</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 