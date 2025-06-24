'use client';

import { useEffect, useState } from 'react';
import ModuleKPICard from './ModuleKPICard';
import TransporterKPIDetails from './TransporterKPIDetails';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays } from 'date-fns';

interface TruckData {
  id: string;
  status: string;
  actualArrivalTime?: string;
  exitTime?: string;
  reportingDate: string;
  reportingTime: string;
  createdAt: string;
  documents?: {
    isValid: boolean;
  };
}

interface SummaryMetrics {
  onTimeRate: number;
  gateUtilization: number;
  avgProcessingTime: number;
  docComplianceRate: number;
  scheduleAdherenceRate: number;
}

interface TransporterKPISummaryProps {
  moduleSlug: string;
}

export default function TransporterKPISummary({ moduleSlug }: TransporterKPISummaryProps) {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    onTimeRate: 0,
    gateUtilization: 0,
    avgProcessingTime: 0,
    docComplianceRate: 0,
    scheduleAdherenceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryMetrics = async () => {
      try {
        const today = new Date();
        const yesterday = subDays(today, 1);
        
        // Fetch last 24 hours of data
        const trucksQuery = query(
          collection(db, 'trucks'),
          where('createdAt', '>=', yesterday.toISOString())
        );

        const trucksSnapshot = await getDocs(trucksQuery);
        const trucks = trucksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TruckData[];

        // Calculate metrics
        const completedTrucks = trucks.filter(truck => {
          if (!truck.actualArrivalTime) return false;
          return (
            truck.status === 'completed' && 
            new Date(truck.actualArrivalTime) <= new Date(`${truck.reportingDate}T${truck.reportingTime}`)
          );
        });

        const onTimeRate = trucks.length > 0 
          ? (completedTrucks.length / trucks.length) * 100 
          : 0;

        const activeGateHours = trucks.length * 0.75; // 45 mins per truck
        const gateUtilization = (activeGateHours / 24) * 100; // 24-hour operation

        const processingTimes = trucks
          .filter(truck => 
            truck.status === 'completed' && 
            truck.exitTime && 
            truck.actualArrivalTime
          )
          .map(truck => {
            if (!truck.actualArrivalTime || !truck.exitTime) return 0;
            const entryTime = new Date(truck.actualArrivalTime).getTime();
            const exitTime = new Date(truck.exitTime).getTime();
            return (exitTime - entryTime) / (1000 * 60); // minutes
          });

        const avgProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
          : 0;

        // Calculate Documentation Compliance Rate
        const trucksWithValidDocs = trucks.filter(truck => 
          truck.documents && truck.documents.isValid
        );
        const docComplianceRate = trucks.length > 0
          ? (trucksWithValidDocs.length / trucks.length) * 100
          : 0;

        // Calculate Schedule Adherence Rate
        const trucksArrivingInWindow = trucks.filter(truck => {
          if (!truck.actualArrivalTime) return false;
          
          const scheduledTime = new Date(`${truck.reportingDate}T${truck.reportingTime}`);
          const arrivalTime = new Date(truck.actualArrivalTime);
          
          // Consider within 30 minutes of scheduled time as adherence
          const timeDiff = Math.abs(arrivalTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
          return timeDiff <= 30;
        });
        
        const scheduleAdherenceRate = trucks.length > 0
          ? (trucksArrivingInWindow.length / trucks.length) * 100
          : 0;

        setMetrics({
          onTimeRate: Math.round(onTimeRate),
          gateUtilization: Math.round(gateUtilization),
          avgProcessingTime: Math.round(avgProcessingTime),
          docComplianceRate: Math.round(docComplianceRate),
          scheduleAdherenceRate: Math.round(scheduleAdherenceRate)
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
      label: 'On-Time Performance',
      value: metrics.onTimeRate,
      unit: '%',
      target: '≥ 95%',
      color: 'text-blue-600'
    },
    {
      label: 'Gate Utilization',
      value: metrics.gateUtilization,
      unit: '%',
      target: '≥ 85%',
      color: 'text-green-600'
    },
    {
      label: 'Avg Processing Time',
      value: metrics.avgProcessingTime,
      unit: ' min',
      target: '≤ 45 min',
      color: 'text-purple-600'
    },
    {
      label: 'Documentation Compliance',
      value: metrics.docComplianceRate,
      unit: '%',
      target: '100%',
      color: 'text-amber-600'
    },
    {
      label: 'Schedule Adherence',
      value: metrics.scheduleAdherenceRate,
      unit: '%',
      target: '≥ 90%',
      color: 'text-indigo-600'
    }
  ];

  return (
    <ModuleKPICard
      title="Transporter Operations"
      description="Detailed analysis of transporter operations including daily trends, gate performance, and transporter-wise metrics"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
} 