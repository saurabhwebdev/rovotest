'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Clock, Truck, ArrowUpDown, ChevronDown, ChevronUp, PanelRightOpen, PanelRightClose, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
      
      setDocks(docksWithStatus);
      
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
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{status.emptyDocks}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{status.occupiedDocks}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
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
              <div className="p-6">
                <div className="flex flex-wrap gap-4">
                  {docks.map((dock, index) => (
                    <motion.div 
                      key={dock.id} 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="relative flex flex-col items-center"
                    >
                      <div 
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 mb-2 shadow-sm hover:shadow-md transition-all duration-200 ${
                          dock.status === 'FREE' 
                            ? 'border-green-500 bg-green-100 dark:bg-green-900' 
                            : dock.status === 'OCCUPIED' 
                              ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 animate-pulse' 
                              : 'border-red-500 bg-red-100 dark:bg-red-900'
                        }`}
                      >
                        <span className="text-xs font-semibold text-center">{dock.name}</span>
                        {dock.status === 'OCCUPIED' && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 animate-ping opacity-75"></span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {dock.status === 'FREE' 
                          ? 'Available' 
                          : dock.status === 'OCCUPIED' 
                            ? `${dock.operationType || ''} in progress` 
                            : 'Not Working'
                        }
                      </span>
                      {dock.truckNumber && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dock.truckNumber}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dock.type}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex gap-6 mt-6"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">In Use</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">Not Working</span>
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