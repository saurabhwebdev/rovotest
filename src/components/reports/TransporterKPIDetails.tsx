'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
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
  exitTime?: string;
  reportingDate: string;
  reportingTime: string;
  createdAt: string;
  transporterName: string;
  gate: string;
  documents?: {
    isValid: boolean;
  };
}

interface DailyMetrics {
  date: string;
  onTimeRate: number;
  gateUtilization: number;
  avgProcessingTime: number;
  totalTrucks: number;
  completedTrucks: number;
  cancelledTrucks: number;
  docComplianceRate: number;
  scheduleAdherenceRate: number;
}

interface GateMetrics {
  gate: string;
  count: number;
  avgProcessingTime: number;
}

interface TransporterMetrics {
  name: string;
  count: number;
  onTimeRate: number;
  docComplianceRate: number;
  scheduleAdherenceRate: number;
}

interface ComplianceData {
  name: string;
  value: number;
}

export default function TransporterKPIDetails() {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [gateMetrics, setGateMetrics] = useState<GateMetrics[]>([]);
  const [transporterMetrics, setTransporterMetrics] = useState<TransporterMetrics[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
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

          const completedTrucks = dayTrucks.filter(truck => {
            if (!truck.actualArrivalTime) return false;
            return (
              truck.status === 'completed' && 
              new Date(truck.actualArrivalTime) <= new Date(`${truck.reportingDate}T${truck.reportingTime}`)
            );
          });

          const cancelledTrucks = dayTrucks.filter(truck => 
            truck.status === 'cancelled'
          );

          const processingTimes = dayTrucks
            .filter(truck => 
              truck.status === 'completed' && 
              truck.exitTime && 
              truck.actualArrivalTime
            )
            .map(truck => {
              if (!truck.actualArrivalTime || !truck.exitTime) return 0;
              const entryTime = new Date(truck.actualArrivalTime).getTime();
              const exitTime = new Date(truck.exitTime).getTime();
              return (exitTime - entryTime) / (1000 * 60);
            });

          const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
            : 0;

          const activeGateHours = dayTrucks.length * 0.75;
          const gateUtilization = (activeGateHours / 24) * 100;

          // Calculate Documentation Compliance Rate
          const trucksWithValidDocs = dayTrucks.filter(truck => 
            truck.documents && truck.documents.isValid
          );
          const docComplianceRate = dayTrucks.length > 0
            ? (trucksWithValidDocs.length / dayTrucks.length) * 100
            : 0;

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

          dailyData.push({
            date: format(date, 'MMM dd'),
            onTimeRate: Math.round(dayTrucks.length > 0 ? (completedTrucks.length / dayTrucks.length) * 100 : 0),
            gateUtilization: Math.round(gateUtilization),
            avgProcessingTime: Math.round(avgProcessingTime),
            totalTrucks: dayTrucks.length,
            completedTrucks: completedTrucks.length,
            cancelledTrucks: cancelledTrucks.length,
            docComplianceRate: Math.round(docComplianceRate),
            scheduleAdherenceRate: Math.round(scheduleAdherenceRate)
          });
        }

        // Process gate metrics
        const gateData = trucksData.reduce((acc: { [key: string]: GateMetrics }, truck) => {
          if (!acc[truck.gate]) {
            acc[truck.gate] = { gate: truck.gate, count: 0, avgProcessingTime: 0 };
          }
          acc[truck.gate].count++;

          if (truck.status === 'completed' && truck.exitTime && truck.actualArrivalTime) {
            const processingTime = (new Date(truck.exitTime).getTime() - new Date(truck.actualArrivalTime).getTime()) / (1000 * 60);
            acc[truck.gate].avgProcessingTime = 
              (acc[truck.gate].avgProcessingTime * (acc[truck.gate].count - 1) + processingTime) / acc[truck.gate].count;
          }

          return acc;
        }, {});

        // Process transporter metrics
        const transporterData = trucksData.reduce((acc: { [key: string]: TransporterMetrics }, truck) => {
          if (!acc[truck.transporterName]) {
            acc[truck.transporterName] = { 
              name: truck.transporterName, 
              count: 0, 
              onTimeRate: 0,
              docComplianceRate: 0,
              scheduleAdherenceRate: 0
            };
          }
          acc[truck.transporterName].count++;

          if (truck.status === 'completed' && truck.actualArrivalTime) {
            const isOnTime = new Date(truck.actualArrivalTime) <= new Date(`${truck.reportingDate}T${truck.reportingTime}`);
            acc[truck.transporterName].onTimeRate = 
              ((acc[truck.transporterName].onTimeRate * (acc[truck.transporterName].count - 1)) + (isOnTime ? 100 : 0)) / 
              acc[truck.transporterName].count;
          }

          // Update documentation compliance rate
          const hasValidDocs = truck.documents && truck.documents.isValid;
          acc[truck.transporterName].docComplianceRate =
            ((acc[truck.transporterName].docComplianceRate * (acc[truck.transporterName].count - 1)) + (hasValidDocs ? 100 : 0)) /
            acc[truck.transporterName].count;

          // Update schedule adherence rate
          if (truck.actualArrivalTime) {
            const scheduledTime = new Date(`${truck.reportingDate}T${truck.reportingTime}`);
            const arrivalTime = new Date(truck.actualArrivalTime);
            const timeDiff = Math.abs(arrivalTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
            const isWithinWindow = timeDiff <= 30;
            
            acc[truck.transporterName].scheduleAdherenceRate =
              ((acc[truck.transporterName].scheduleAdherenceRate * (acc[truck.transporterName].count - 1)) + (isWithinWindow ? 100 : 0)) /
              acc[truck.transporterName].count;
          }

          return acc;
        }, {});

        // Create compliance summary data for pie chart
        const compliantTrucks = trucksData.filter(truck => truck.documents && truck.documents.isValid).length;
        const nonCompliantTrucks = trucksData.length - compliantTrucks;
        
        const complianceSummary = [
          { name: 'Compliant', value: compliantTrucks },
          { name: 'Non-Compliant', value: nonCompliantTrucks }
        ];

        setDailyMetrics(dailyData.reverse());
        setGateMetrics(Object.values(gateData));
        setTransporterMetrics(Object.values(transporterData));
        setComplianceData(complianceSummary);
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

  // Colors for pie chart
  const COLORS = ['#16a34a', '#dc2626'];

  return (
    <div className="space-y-8 min-h-[500px]">
      {/* Daily Trends */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Performance Trends</h3>
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
              <Line type="monotone" dataKey="docComplianceRate" name="Doc Compliance (%)" stroke="#f59e0b" />
              <Line type="monotone" dataKey="scheduleAdherenceRate" name="Schedule Adherence (%)" stroke="#4f46e5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Volume */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Truck Volume</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalTrucks" name="Total Trucks" fill="#2563eb" />
              <Bar dataKey="completedTrucks" name="Completed" fill="#16a34a" />
              <Bar dataKey="cancelledTrucks" name="Cancelled" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Documentation Compliance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Documentation Compliance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent?: number }) => 
                    `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} trucks`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Card className="p-4 flex flex-col justify-center">
            <h4 className="font-medium mb-4">Documentation Compliance Details</h4>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Total Trucks Checked:</span>
                <span className="font-semibold">{complianceData.reduce((acc, item) => acc + item.value, 0)}</span>
              </li>
              <li className="flex justify-between">
                <span>Compliant Trucks:</span>
                <span className="font-semibold text-green-600">{complianceData[0]?.value || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Non-Compliant Trucks:</span>
                <span className="font-semibold text-red-600">{complianceData[1]?.value || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Compliance Rate:</span>
                <span className="font-semibold">
                  {complianceData[0]?.value
                    ? ((complianceData[0].value / complianceData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1)
                    : 0}%
                </span>
              </li>
              <li className="text-sm text-gray-500 mt-4">
                Target: 100% compliance according to regulatory requirements
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Gate Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Gate Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateMetrics.map((gate) => (
            <Card key={gate.gate} className="p-4">
              <h4 className="font-medium text-gray-600">{gate.gate}</h4>
              <div className="mt-2 space-y-2">
                <p>Total Trucks: <span className="font-semibold">{gate.count}</span></p>
                <p>Avg Processing Time: <span className="font-semibold">{Math.round(gate.avgProcessingTime)} min</span></p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Transporter Performance */}
      <div className="pb-4">
        <h3 className="text-lg font-semibold mb-4">Transporter Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transporterMetrics.map((transporter) => (
            <Card key={transporter.name} className="p-4">
              <h4 className="font-medium text-gray-600">{transporter.name}</h4>
              <div className="mt-2 space-y-2">
                <p>Total Trucks: <span className="font-semibold">{transporter.count}</span></p>
                <p>On-Time Performance: <span className="font-semibold">{Math.round(transporter.onTimeRate)}%</span></p>
                <p>Documentation Compliance: <span className="font-semibold">{Math.round(transporter.docComplianceRate)}%</span></p>
                <p>Schedule Adherence: <span className="font-semibold">{Math.round(transporter.scheduleAdherenceRate)}%</span></p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 