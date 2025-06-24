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

interface DockOperation {
  id: string;
  startTime: any;
  endTime: any;
  status: string;
  operationType: 'LOADING' | 'UNLOADING';
  dockId: string;
  dockName: string;
}

interface DailyMetrics {
  date: string;
  dockOccupancyRate: number;
  avgOperationDuration: number;
  operationCompletionRate: number;
  turnaroundCompliance: number;
  totalOperations: number;
  completedOperations: number;
}

interface DockMetrics {
  dockId: string;
  dockName: string;
  totalOperations: number;
  avgDuration: number;
  occupancyRate: number;
  completionRate: number;
}

export default function DockKPIDetails() {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [dockMetrics, setDockMetrics] = useState<DockMetrics[]>([]);
  const [operationTypeData, setOperationTypeData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetailedMetrics = async () => {
      try {
        const today = new Date();
        const dailyData: DailyMetrics[] = [];
        const dockData: { [key: string]: DockMetrics } = {};
        let loadingOps = 0;
        let unloadingOps = 0;

        // Fetch operations for the last 7 days
        const q = query(
          collection(db, 'dockOperations'),
          where('startTime', '>=', subDays(today, 7))
        );
        const querySnapshot = await getDocs(q);
        const operationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DockOperation[];

        // Process daily metrics
        for (let i = 0; i < 7; i++) {
          const date = subDays(today, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          
          const dayOperations = operationsData.filter(op => 
            format(op.startTime.toDate(), 'yyyy-MM-dd') === dateStr
          );

          const completedOps = dayOperations.filter(op => op.status === 'COMPLETED');
          
          const durations = completedOps
            .filter(op => op.endTime)
            .map(op => (op.endTime.toDate().getTime() - op.startTime.toDate().getTime()) / (1000 * 60));

          const avgDuration = durations.length > 0
            ? durations.reduce((acc, dur) => acc + dur, 0) / durations.length
            : 0;

          const occupiedHours = durations.reduce((acc, dur) => acc + (dur / 60), 0);
          const occupancyRate = (occupiedHours / 24) * 100;

          const compliantOps = durations.filter(dur => dur <= 60).length;
          const turnaroundCompliance = durations.length > 0
            ? (compliantOps / durations.length) * 100
            : 0;

          dailyData.push({
            date: format(date, 'MMM dd'),
            dockOccupancyRate: Math.round(occupancyRate),
            avgOperationDuration: Math.round(avgDuration),
            operationCompletionRate: Math.round(dayOperations.length > 0 ? (completedOps.length / dayOperations.length) * 100 : 0),
            turnaroundCompliance: Math.round(turnaroundCompliance),
            totalOperations: dayOperations.length,
            completedOperations: completedOps.length
          });
        }

        // Process dock-specific metrics
        operationsData.forEach(op => {
          if (!dockData[op.dockId]) {
            dockData[op.dockId] = {
              dockId: op.dockId,
              dockName: op.dockName,
              totalOperations: 0,
              avgDuration: 0,
              occupancyRate: 0,
              completionRate: 0
            };
          }

          dockData[op.dockId].totalOperations++;

          if (op.status === 'COMPLETED' && op.endTime) {
            const duration = (op.endTime.toDate().getTime() - op.startTime.toDate().getTime()) / (1000 * 60);
            dockData[op.dockId].avgDuration = 
              (dockData[op.dockId].avgDuration * (dockData[op.dockId].totalOperations - 1) + duration) / 
              dockData[op.dockId].totalOperations;
          }

          // Count operation types
          if (op.operationType === 'LOADING') loadingOps++;
          else unloadingOps++;
        });

        // Calculate completion rates for each dock
        Object.values(dockData).forEach(dock => {
          const dockOps = operationsData.filter(op => op.dockId === dock.dockId);
          const completedOps = dockOps.filter(op => op.status === 'COMPLETED');
          dock.completionRate = Math.round((completedOps.length / dockOps.length) * 100);
        });

        setDailyMetrics(dailyData.reverse());
        setDockMetrics(Object.values(dockData));
        setOperationTypeData([
          { name: 'Loading', value: loadingOps },
          { name: 'Unloading', value: unloadingOps }
        ]);
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
              <Line type="monotone" dataKey="dockOccupancyRate" name="Dock Occupancy (%)" stroke="#2563eb" />
              <Line type="monotone" dataKey="avgOperationDuration" name="Avg Duration (min)" stroke="#16a34a" />
              <Line type="monotone" dataKey="operationCompletionRate" name="Completion Rate (%)" stroke="#9333ea" />
              <Line type="monotone" dataKey="turnaroundCompliance" name="Turnaround Compliance (%)" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Operations Volume */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Operations Volume</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyMetrics} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalOperations" name="Total Operations" fill="#2563eb" />
              <Bar dataKey="completedOperations" name="Completed" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operation Types Distribution */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Operation Types Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operationTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {operationTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} operations`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Card className="p-4">
            <h4 className="font-medium mb-4">Operation Type Details</h4>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Total Operations:</span>
                <span className="font-semibold">
                  {operationTypeData.reduce((acc, item) => acc + item.value, 0)}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Loading Operations:</span>
                <span className="font-semibold text-green-600">
                  {operationTypeData[0]?.value || 0}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Unloading Operations:</span>
                <span className="font-semibold text-red-600">
                  {operationTypeData[1]?.value || 0}
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Dock Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Individual Dock Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dockMetrics.map((dock) => (
            <Card key={dock.dockId} className="p-4">
              <h4 className="font-medium text-gray-600">{dock.dockName}</h4>
              <div className="mt-2 space-y-2">
                <p>Total Operations: <span className="font-semibold">{dock.totalOperations}</span></p>
                <p>Avg Duration: <span className="font-semibold">{Math.round(dock.avgDuration)} min</span></p>
                <p>Completion Rate: <span className="font-semibold">{dock.completionRate}%</span></p>
                <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, dock.completionRate)}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Optimize dock assignments based on operation type and duration patterns</li>
          <li>Investigate docks with lower completion rates for potential bottlenecks</li>
          <li>Consider implementing a dock reservation system to improve utilization</li>
          <li>Review and adjust standard operation durations based on historical data</li>
          <li>Implement real-time monitoring for operations exceeding target durations</li>
        </ul>
      </Card>
    </div>
  );
} 