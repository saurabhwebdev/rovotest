'use client';

import { useEffect, useState } from 'react';
import ModuleKPICard from './ModuleKPICard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format } from 'date-fns';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TruckData {
  id: string;
  status: string;
  actualArrivalTime?: string;
  reportingDate: string;
  reportingTime: string;
  createdAt: string;
  transporterName: string;
}

interface SummaryMetrics {
  scheduleAdherenceRate: number;
  cancellationRate: number;
}

interface DailyMetrics {
  date: string;
  scheduleAdherenceRate: number;
  cancellationRate: number;
  totalTrucks: number;
}

interface TransporterScheduleMetrics {
  name: string;
  scheduleAdherenceRate: number;
  cancellationRate: number;
  totalTrucks: number;
}

const SchedulingEffectivenessDetails = () => {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [transporterMetrics, setTransporterMetrics] = useState<TransporterScheduleMetrics[]>([]);
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

        // Process daily metrics
        const dailyData: DailyMetrics[] = [];
        for (let i = 0; i < 7; i++) {
          const date = subDays(today, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          const dayTrucks = trucksData.filter(truck => 
            truck.createdAt.startsWith(dateStr)
          );

          // Calculate Schedule Adherence Rate
          const trucksArrivingInWindow = dayTrucks.filter(truck => {
            if (!truck.actualArrivalTime) return false;
            
            const scheduledTime = new Date(`${truck.reportingDate}T${truck.reportingTime}`);
            const arrivalTime = new Date(truck.actualArrivalTime);
            
            // Consider within 30 minutes of scheduled time as adherence
            const timeDiff = Math.abs(arrivalTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
            return timeDiff <= 30;
          });
          
          const scheduleAdherenceRate = dayTrucks.length > 0
            ? (trucksArrivingInWindow.length / dayTrucks.length) * 100
            : 0;

          // Calculate Cancellation Rate
          const cancelledTrucks = dayTrucks.filter(truck => 
            truck.status === 'cancelled'
          );
          
          const cancellationRate = dayTrucks.length > 0
            ? (cancelledTrucks.length / dayTrucks.length) * 100
            : 0;

          dailyData.push({
            date: format(date, 'MMM dd'),
            scheduleAdherenceRate: Math.round(scheduleAdherenceRate),
            cancellationRate: Math.round(cancellationRate),
            totalTrucks: dayTrucks.length
          });
        }

        // Process transporter metrics
        const transporterData = trucksData.reduce((acc: { [key: string]: TransporterScheduleMetrics }, truck) => {
          if (!acc[truck.transporterName]) {
            acc[truck.transporterName] = { 
              name: truck.transporterName, 
              scheduleAdherenceRate: 0,
              cancellationRate: 0,
              totalTrucks: 0
            };
          }
          
          acc[truck.transporterName].totalTrucks++;

          // Update schedule adherence rate
          if (truck.actualArrivalTime) {
            const scheduledTime = new Date(`${truck.reportingDate}T${truck.reportingTime}`);
            const arrivalTime = new Date(truck.actualArrivalTime);
            const timeDiff = Math.abs(arrivalTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
            const isWithinWindow = timeDiff <= 30;
            
            acc[truck.transporterName].scheduleAdherenceRate =
              ((acc[truck.transporterName].scheduleAdherenceRate * (acc[truck.transporterName].totalTrucks - 1)) + (isWithinWindow ? 100 : 0)) /
              acc[truck.transporterName].totalTrucks;
          }

          // Update cancellation rate
          if (truck.status === 'cancelled') {
            acc[truck.transporterName].cancellationRate = 
              ((acc[truck.transporterName].cancellationRate * (acc[truck.transporterName].totalTrucks - 1)) + 100) / 
              acc[truck.transporterName].totalTrucks;
          }

          return acc;
        }, {});

        setDailyMetrics(dailyData.reverse());
        setTransporterMetrics(Object.values(transporterData).sort((a, b) => b.totalTrucks - a.totalTrucks));
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

  // Colors for charts
  const COLORS = ['#16a34a', '#dc2626', '#f59e0b', '#2563eb'];

  return (
    <div className="space-y-8 min-h-[500px]">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">About Scheduling Effectiveness KPI</h3>
        <p className="mb-4">
          Scheduling Effectiveness measures how well the truck scheduling system is working and how reliably
          transporters are adhering to their scheduled times.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Schedule Adherence Rate:</span> Percentage of trucks arriving within 
            their scheduled window. Target: ≥ 90%
          </li>
          <li>
            <span className="font-medium">Cancellation Rate:</span> Percentage of scheduled trucks that were 
            cancelled. Target: ≤ 5%
          </li>
        </ul>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Weekly Scheduling Trends</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyMetrics} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="scheduleAdherenceRate" name="Schedule Adherence (%)" stroke="#4f46e5" />
              <Line type="monotone" dataKey="cancellationRate" name="Cancellation Rate (%)" stroke="#dc2626" />
              <Line type="monotone" dataKey="totalTrucks" name="Total Trucks" stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Transporter Scheduling Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transporterMetrics.slice(0, 6).map((transporter) => (
            <Card key={transporter.name} className="p-4">
              <h4 className="font-medium text-gray-600">{transporter.name}</h4>
              <div className="mt-2 space-y-2">
                <p>Total Scheduled Trucks: <span className="font-semibold">{transporter.totalTrucks}</span></p>
                <p>Schedule Adherence: <span className="font-semibold">{Math.round(transporter.scheduleAdherenceRate)}%</span></p>
                <p>Cancellation Rate: <span className="font-semibold">{Math.round(transporter.cancellationRate)}%</span></p>
                <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, transporter.scheduleAdherenceRate)}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Implement a reminder system to notify transporters about upcoming schedules</li>
          <li>Analyze patterns in cancellations to identify root causes</li>
          <li>Consider penalties for excessive cancellations or rewards for consistent adherence</li>
          <li>Optimize scheduling windows to account for typical traffic patterns and seasonal variations</li>
          <li>Provide transporters with real-time updates on facility congestion</li>
        </ul>
      </Card>
    </div>
  );
};

export default function SchedulingEffectivenessKPI() {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    scheduleAdherenceRate: 0,
    cancellationRate: 0
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

        // Calculate Cancellation Rate
        const cancelledTrucks = trucks.filter(truck => 
          truck.status === 'cancelled'
        );
        
        const cancellationRate = trucks.length > 0
          ? (cancelledTrucks.length / trucks.length) * 100
          : 0;

        setMetrics({
          scheduleAdherenceRate: Math.round(scheduleAdherenceRate),
          cancellationRate: Math.round(cancellationRate)
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
      label: 'Schedule Adherence',
      value: metrics.scheduleAdherenceRate,
      unit: '%',
      target: '≥ 90%',
      color: 'text-indigo-600'
    },
    {
      label: 'Cancellation Rate',
      value: metrics.cancellationRate,
      unit: '%',
      target: '≤ 5%',
      color: 'text-red-600'
    }
  ];

  return (
    <ModuleKPICard
      title="Scheduling Effectiveness"
      description="Analysis of truck scheduling system effectiveness, adherence to schedules, and cancellation patterns"
      metrics={kpiMetrics}
      DetailComponent={SchedulingEffectivenessDetails}
    />
  );
} 