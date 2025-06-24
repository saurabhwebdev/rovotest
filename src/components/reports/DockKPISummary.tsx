'use client';

import { useEffect, useState } from 'react';
import ModuleKPICard from './ModuleKPICard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays } from 'date-fns';

interface DockOperation {
  id: string;
  startTime: any;
  endTime: any;
  status: string;
  operationType: 'LOADING' | 'UNLOADING';
  dockId: string;
}

interface SummaryMetrics {
  dockOccupancyRate: number;
  avgOperationDuration: number;
  operationCompletionRate: number;
  turnaroundCompliance: number;
}

interface DockKPISummaryProps {
  moduleSlug: string;
}

export default function DockKPISummary({ moduleSlug }: DockKPISummaryProps) {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    dockOccupancyRate: 0,
    avgOperationDuration: 0,
    operationCompletionRate: 0,
    turnaroundCompliance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryMetrics = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = subDays(today, 7);

        // Fetch dock operations for the last 7 days
        const q = query(
          collection(db, 'dockOperations'),
          where('startTime', '>=', sevenDaysAgo)
        );
        const querySnapshot = await getDocs(q);
        const operationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DockOperation[];

        // Calculate metrics
        const totalOperations = operationsData.length;
        const completedOperations = operationsData.filter(op => op.status === 'COMPLETED').length;
        
        // Calculate operation durations
        const operationDurations = operationsData
          .filter(op => op.status === 'COMPLETED' && op.endTime)
          .map(op => {
            const duration = (op.endTime.toDate().getTime() - op.startTime.toDate().getTime()) / (1000 * 60);
            return duration;
          });

        const avgDuration = operationDurations.length > 0
          ? operationDurations.reduce((acc, dur) => acc + dur, 0) / operationDurations.length
          : 0;

        // Calculate dock occupancy
        const totalDockHours = 24 * 7; // 24 hours * 7 days
        const occupiedHours = operationDurations.reduce((acc, dur) => acc + (dur / 60), 0);
        const occupancyRate = (occupiedHours / totalDockHours) * 100;

        // Calculate turnaround compliance
        const compliantOperations = operationDurations.filter(duration => 
          duration <= (60) // Target: Loading ≤ 60 minutes
        ).length;
        const turnaroundCompliance = operationDurations.length > 0
          ? (compliantOperations / operationDurations.length) * 100
          : 0;

        setMetrics({
          dockOccupancyRate: Math.round(occupancyRate),
          avgOperationDuration: Math.round(avgDuration),
          operationCompletionRate: Math.round(totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0),
          turnaroundCompliance: Math.round(turnaroundCompliance)
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching summary metrics:', error);
        setLoading(false);
      }
    };

    fetchSummaryMetrics();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading metrics...</div>;
  }

  const kpiMetrics = [
    {
      label: 'Dock Occupancy Rate',
      value: metrics.dockOccupancyRate,
      unit: '%',
      target: '≥ 85%',
      color: 'text-blue-600'
    },
    {
      label: 'Avg Operation Duration',
      value: metrics.avgOperationDuration,
      unit: ' min',
      target: '≤ 60 min',
      color: 'text-green-600'
    },
    {
      label: 'Operation Completion Rate',
      value: metrics.operationCompletionRate,
      unit: '%',
      target: '≥ 95%',
      color: 'text-purple-600'
    },
    {
      label: 'Turnaround Compliance',
      value: metrics.turnaroundCompliance,
      unit: '%',
      target: '≥ 90%',
      color: 'text-amber-600'
    }
  ];

  return (
    <ModuleKPICard
      title="Dock Operations"
      description="Analysis of dock utilization, operation durations, and completion rates"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
} 