'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Clock, Truck, ArrowUpDown } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface DockStatus {
  totalDocks: number;
  occupiedDocks: number;
  emptyDocks: number;
  averageOperationTime: number;
  averageUtilization: number;
}

export default function DockStatusOverview() {
  const [status, setStatus] = useState<DockStatus>({
    totalDocks: 0,
    occupiedDocks: 0,
    emptyDocks: 0,
    averageOperationTime: 0,
    averageUtilization: 0,
  });

  useEffect(() => {
    fetchDockStatus();
  }, []);

  const fetchDockStatus = async () => {
    try {
      // Get all docks
      const docksSnapshot = await getDocs(collection(db, 'docks'));
      const totalDocks = docksSnapshot.size;

      // Get active dock operations
      const activeOpsQuery = query(
        collection(db, 'dockOperations'),
        where('status', '==', 'IN_PROGRESS')
      );
      const activeOpsSnapshot = await getDocs(activeOpsQuery);
      const occupiedDocks = activeOpsSnapshot.size;

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
        emptyDocks: totalDocks - occupiedDocks,
        averageOperationTime: Math.round(averageTime),
        averageUtilization: Math.round(utilization),
      });
    } catch (error) {
      console.error('Error fetching dock status:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="p-4 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Docks</h3>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
          <AnimatedCounter end={status.totalDocks} duration={1} />
        </div>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Available Docks</h3>
        <div className="text-3xl font-bold text-green-600 dark:text-green-300">
          <AnimatedCounter end={status.emptyDocks} duration={1} />
        </div>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center bg-yellow-50 dark:bg-yellow-900">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Occupied Docks</h3>
        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
          <AnimatedCounter end={status.occupiedDocks} duration={1} />
        </div>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Avg. Operation Time</h3>
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-300" />
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
            <AnimatedCounter end={status.averageOperationTime} duration={1} suffix=" min" />
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Dock Utilization</h3>
        <div className="flex items-center">
          <ArrowUpDown className="w-5 h-5 mr-2 text-red-600 dark:text-red-300" />
          <div className="text-2xl font-bold text-red-600 dark:text-red-300">
            <AnimatedCounter end={status.averageUtilization} duration={1} suffix="%" />
          </div>
        </div>
      </Card>
    </div>
  );
} 