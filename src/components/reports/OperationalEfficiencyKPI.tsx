'use client';

import { useEffect, useState } from 'react';
import ModuleKPICard from './ModuleKPICard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface TruckData {
  id: string;
  status: string;
  actualArrivalTime?: string;
  exitTime?: string;
  reportingDate: string;
  reportingTime: string;
  createdAt: string;
}

interface SummaryMetrics {
  onTimeRate: number;
  gateUtilization: number;
  avgProcessingTime: number;
}

interface DailyMetrics {
  date: string;
  onTimeRate: number;
  gateUtilization: number;
  avgProcessingTime: number;
}

interface OperationalEfficiencyKPIProps {
  moduleSlug: string;
}

export const OperationalEfficiencyDetails = () => {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetailedMetrics = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const sevenDaysAgo = subDays(today, 7);

        // Fetch trucks data for the last 7 days
        const trucksQuery = query(
          collection(db, 'trucks'),
          where('createdAt', '>=', sevenDaysAgo.toISOString())
        );

        const trucksSnapshot = await getDocs(trucksQuery);
        const trucksData = trucksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TruckData[];

        // Group by day and calculate metrics
        const metricsByDay = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(today, i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayTrucks = trucksData.filter(truck => 
            truck.createdAt.startsWith(dateStr)
          );
          
          const onTimeArrivals = dayTrucks.filter(truck => {
            if (!truck.actualArrivalTime) return false;
            return new Date(truck.actualArrivalTime) <= new Date(`${truck.reportingDate}T${truck.reportingTime}`);
          });
          
          const onTimeRate = dayTrucks.length > 0 
            ? (onTimeArrivals.length / dayTrucks.length) * 100 
            : 0;
            
          // Calculate gate utilization (assume 24-hour operation)
          const activeGateHours = dayTrucks.length * 0.75; // 45 mins per truck
          const gateUtilization = (activeGateHours / 24) * 100; // 24-hour operation
          
          // Calculate average processing time
          const processingTimes = dayTrucks
            .filter(truck => truck.status === 'completed' && truck.exitTime && truck.actualArrivalTime)
            .map(truck => {
              if (!truck.actualArrivalTime || !truck.exitTime) return 0;
              const entryTime = new Date(truck.actualArrivalTime).getTime();
              const exitTime = new Date(truck.exitTime).getTime();
              return (exitTime - entryTime) / (1000 * 60); // minutes
            });
            
          const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
            : 0;
            
          return {
            date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
            onTimeRate: Math.round(onTimeRate),
            gateUtilization: Math.round(gateUtilization),
            avgProcessingTime: Math.round(avgProcessingTime)
          };
        });
        
        setDailyMetrics(metricsByDay.reverse());
        setLoading(false);
      } catch (err) {
        console.error('Error fetching detailed metrics:', err);
        setError('Failed to load detailed metrics');
        setLoading(false);
      }
    };

    fetchDetailedMetrics();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading detailed metrics...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="space-y-8 min-h-[500px]">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">About Operational Efficiency KPI</h3>
        <p className="mb-4">
          Operational Efficiency measures the overall effectiveness of transportation operations, including how 
          efficiently trucks are processed, gate resource utilization, and adherence to scheduled times.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">On-Time Performance Rate:</span> Percentage of trucks arriving on or before 
            their scheduled time. Target: ≥ 95%
          </li>
          <li>
            <span className="font-medium">Gate Utilization Rate:</span> Percentage of available gate hours being 
            actively used. Target: ≥ 85%
          </li>
          <li>
            <span className="font-medium">Average Processing Time:</span> Average time between truck arrival and 
            departure. Target: ≤ 45 minutes
          </li>
        </ul>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Weekly Trend Analysis</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyMetrics} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="onTimeRate" name="On-Time Rate (%)" stroke="#2563eb" />
              <Line type="monotone" dataKey="gateUtilization" name="Gate Utilization (%)" stroke="#16a34a" />
              <Line type="monotone" dataKey="avgProcessingTime" name="Avg Processing (min)" stroke="#9333ea" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Operational Metrics Comparison</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="onTimeRate" name="On-Time Rate (%)" fill="#2563eb" />
              <Bar dataKey="gateUtilization" name="Gate Utilization (%)" fill="#16a34a" />
              <Bar dataKey="avgProcessingTime" name="Avg Processing (min)" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Optimize gate staffing during peak hours to improve utilization rates</li>
          <li>Implement pre-arrival documentation verification to reduce processing times</li>
          <li>Set up automatic notifications for transporters to improve on-time performance</li>
          <li>Review processing bottlenecks to streamline truck movement through the facility</li>
        </ul>
      </Card>
    </div>
  );
};

export default function OperationalEfficiencyKPI({ moduleSlug }: OperationalEfficiencyKPIProps) {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    onTimeRate: 0,
    gateUtilization: 0,
    avgProcessingTime: 0
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

        // Calculate on-time performance rate
        const onTimeArrivals = trucks.filter(truck => {
          if (!truck.actualArrivalTime) return false;
          return new Date(truck.actualArrivalTime) <= new Date(`${truck.reportingDate}T${truck.reportingTime}`);
        });
        
        const onTimeRate = trucks.length > 0 
          ? (onTimeArrivals.length / trucks.length) * 100 
          : 0;

        // Calculate gate utilization (assume 24-hour operation)
        const activeGateHours = trucks.length * 0.75; // 45 mins per truck
        const gateUtilization = (activeGateHours / 24) * 100; // 24-hour operation

        // Calculate average processing time
        const processingTimes = trucks
          .filter(truck => truck.status === 'completed' && truck.exitTime && truck.actualArrivalTime)
          .map(truck => {
            if (!truck.actualArrivalTime || !truck.exitTime) return 0;
            const entryTime = new Date(truck.actualArrivalTime).getTime();
            const exitTime = new Date(truck.exitTime).getTime();
            return (exitTime - entryTime) / (1000 * 60); // minutes
          });
          
        const avgProcessingTime = processingTimes.length > 0
          ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
          : 0;

        setMetrics({
          onTimeRate: Math.round(onTimeRate),
          gateUtilization: Math.round(gateUtilization),
          avgProcessingTime: Math.round(avgProcessingTime)
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
    }
  ];

  return (
    <ModuleKPICard
      title="Operational Efficiency"
      description="Analysis of overall transportation operations efficiency, including time metrics and resource utilization"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
} 