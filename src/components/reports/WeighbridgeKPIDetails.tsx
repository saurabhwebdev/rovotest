'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, Timestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import ModuleKPICard from './ModuleKPICard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';

interface WeighbridgeEntry {
  id: string;
  truckNumber: string;
  transporterName: string;
  status: string;
  inTime: Timestamp;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weighingTime?: Timestamp;
  currentMilestone: 'PENDING_WEIGHING' | 'WEIGHED' | 'AT_PARKING' | 'AT_DOCK';
  dockId?: string;
  dockName?: string;
  dockAssignmentTime?: Timestamp;
  rejectionRemarks?: string;
}

interface ProcessingTimeData {
  hour: number;
  averageTime: number;
  count: number;
}

interface TransporterPerformance {
  transporterName: string;
  averageProcessingTime: number;
  totalTrucks: number;
  complianceRate: number;
}

interface DockUtilization {
  dockName: string;
  utilizationRate: number;
  averageWaitTime: number;
}

interface WeighbridgeKPIProps {
  startDate: Date;
  endDate: Date;
}

export default function WeighbridgeKPIDetails({ startDate, endDate }: WeighbridgeKPIProps) {
  const [processingTimeData, setProcessingTimeData] = useState<ProcessingTimeData[]>([]);
  const [transporterPerformance, setTransporterPerformance] = useState<TransporterPerformance[]>([]);
  const [dockUtilization, setDockUtilization] = useState<DockUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallMetrics, setOverallMetrics] = useState({
    averageProcessingTime: 0,
    totalTrucks: 0,
    rejectionRate: 0,
    utilizationRate: 0
  });

  useEffect(() => {
    fetchKPIData();
  }, [startDate, endDate]);

  const fetchKPIData = async () => {
    try {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // Query weighbridge entries
      const entriesQuery = query(
        collection(db, 'weighbridgeEntries'),
        where('inTime', '>=', startTimestamp),
        where('inTime', '<=', endTimestamp)
      );

      const entriesSnapshot = await getDocs(entriesQuery);
      const entries = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeighbridgeEntry[];

      // Calculate processing times by hour
      const timesByHour = new Map<number, { total: number; count: number }>();
      const transporterStats = new Map<string, { 
        totalTime: number; 
        count: number; 
        compliant: number 
      }>();
      const dockStats = new Map<string, { 
        totalWaitTime: number; 
        assignmentCount: number 
      }>();

      let totalProcessingTime = 0;
      let totalRejections = 0;

      entries.forEach(entry => {
        // Process hourly data
        const hour = new Date(entry.inTime.toDate()).getHours();
        const currentHourData = timesByHour.get(hour) || { total: 0, count: 0 };
        
        if (entry.weighingTime) {
          const processingTime = entry.weighingTime.toDate().getTime() - entry.inTime.toDate().getTime();
          currentHourData.total += processingTime;
          currentHourData.count += 1;
          timesByHour.set(hour, currentHourData);
          totalProcessingTime += processingTime;
        }

        // Process transporter data
        const transporterData = transporterStats.get(entry.transporterName) || {
          totalTime: 0,
          count: 0,
          compliant: 0
        };
        
        if (entry.weighingTime) {
          const processingTime = entry.weighingTime.toDate().getTime() - entry.inTime.toDate().getTime();
          transporterData.totalTime += processingTime;
          transporterData.count += 1;
          if (entry.status !== 'WEIGHING_REJECTED') {
            transporterData.compliant += 1;
          }
        }
        transporterStats.set(entry.transporterName, transporterData);

        // Process dock utilization
        if (entry.dockName && entry.dockAssignmentTime && entry.weighingTime) {
          const dockData = dockStats.get(entry.dockName) || {
            totalWaitTime: 0,
            assignmentCount: 0
          };
          
          const waitTime = entry.dockAssignmentTime.toDate().getTime() - entry.weighingTime.toDate().getTime();
          dockData.totalWaitTime += waitTime;
          dockData.assignmentCount += 1;
          dockStats.set(entry.dockName, dockData);
        }

        // Count rejections
        if (entry.status === 'WEIGHING_REJECTED') {
          totalRejections += 1;
        }
      });

      // Transform processing time data
      const processedTimeData = Array.from(timesByHour.entries()).map(([hour, data]) => ({
        hour,
        averageTime: data.total / data.count / 60000, // Convert to minutes
        count: data.count
      }));

      // Transform transporter performance data
      const processedTransporterData = Array.from(transporterStats.entries()).map(([name, data]) => ({
        transporterName: name,
        averageProcessingTime: data.totalTime / data.count / 60000, // Convert to minutes
        totalTrucks: data.count,
        complianceRate: (data.compliant / data.count) * 100
      }));

      // Transform dock utilization data
      const processedDockData = Array.from(dockStats.entries()).map(([name, data]) => ({
        dockName: name,
        utilizationRate: (data.assignmentCount / entries.length) * 100,
        averageWaitTime: data.totalWaitTime / data.assignmentCount / 60000 // Convert to minutes
      }));

      // Calculate overall metrics
      const overallMetrics = {
        averageProcessingTime: totalProcessingTime / entries.length / 60000,
        totalTrucks: entries.length,
        rejectionRate: (totalRejections / entries.length) * 100,
        utilizationRate: (entries.filter(e => e.currentMilestone === 'WEIGHED' || e.currentMilestone === 'AT_DOCK').length / entries.length) * 100
      };

      setProcessingTimeData(processedTimeData);
      setTransporterPerformance(processedTransporterData);
      setDockUtilization(processedDockData);
      setOverallMetrics(overallMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleKPICard
          title="Average Processing Time"
          value={`${overallMetrics.averageProcessingTime.toFixed(2)} min`}
          trend={0}
          description="Average time from entry to weighing completion"
          isSimple={true}
        />
        <ModuleKPICard
          title="Total Trucks Processed"
          value={overallMetrics.totalTrucks.toString()}
          trend={0}
          description="Total number of trucks processed"
          isSimple={true}
        />
        <ModuleKPICard
          title="Rejection Rate"
          value={`${overallMetrics.rejectionRate.toFixed(2)}%`}
          trend={0}
          description="Percentage of weighing operations rejected"
          isSimple={true}
        />
        <ModuleKPICard
          title="Utilization Rate"
          value={`${overallMetrics.utilizationRate.toFixed(2)}%`}
          trend={0}
          description="Weighbridge utilization rate"
          isSimple={true}
        />
      </div>

      {/* Processing Time by Hour */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Processing Time by Hour</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={processingTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="averageTime" name="Avg. Time (min)" stroke="#8884d8" />
            <Line type="monotone" dataKey="count" name="Number of Trucks" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transporter Performance */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Transporter Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={transporterPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="transporterName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageProcessingTime" name="Avg. Processing Time (min)" fill="#8884d8" />
            <Bar dataKey="complianceRate" name="Compliance Rate (%)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dock Utilization */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Dock Utilization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dockUtilization}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dockName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilizationRate" name="Utilization Rate (%)" fill="#8884d8" />
            <Bar dataKey="averageWaitTime" name="Avg. Wait Time (min)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 