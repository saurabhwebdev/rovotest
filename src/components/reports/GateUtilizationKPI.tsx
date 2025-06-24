'use client';

import { useEffect, useState } from 'react';
import ModuleKPICard from './ModuleKPICard';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
  Bar,
  AreaChart,
  Area
} from 'recharts';

interface GateData {
  hour: number;
  capacity: number;
  processed: number;
  utilization: number;
  queueTime: number;
}

interface SummaryMetrics {
  peakHourPerformance: number;
  avgQueueTime: number;
}

interface GateUtilizationKPIProps {
  moduleSlug: string;
}

export const GateUtilizationDetails = () => {
  const [loading, setLoading] = useState(true);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    peakHourPerformance: 0,
    avgQueueTime: 0
  });
  const [hourlyData, setHourlyData] = useState<GateData[]>([]);
  const [gateUtilizationByDay, setGateUtilizationByDay] = useState<{day: string, utilization: number}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Simulate fetching data from Firestore
      // In a real implementation, this would query collections related to gate operations
      
      // Mock hourly data for a typical day
      const mockHourlyData: GateData[] = [];
      
      for (let hour = 6; hour <= 18; hour++) {
        // Generate realistic utilization pattern with morning and evening peaks
        let utilization = 0;
        let queueTime = 0;
        
        if (hour >= 7 && hour <= 9) {
          // Morning peak
          utilization = 75 + Math.random() * 15; // 75-90%
          queueTime = 8 + Math.random() * 7; // 8-15 minutes
        } else if (hour >= 16 && hour <= 18) {
          // Evening peak
          utilization = 70 + Math.random() * 20; // 70-90%
          queueTime = 7 + Math.random() * 8; // 7-15 minutes
        } else {
          // Normal hours
          utilization = 40 + Math.random() * 30; // 40-70%
          queueTime = 2 + Math.random() * 5; // 2-7 minutes
        }
        
        const capacity = 15; // Trucks per hour capacity
        const processed = Math.round((capacity * utilization) / 100);
        
        mockHourlyData.push({
          hour,
          capacity,
          processed,
          utilization: parseFloat(utilization.toFixed(1)),
          queueTime: parseFloat(queueTime.toFixed(1))
        });
      }
      
      // Weekly utilization by day
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const mockWeeklyData = days.map(day => ({
        day,
        utilization: parseFloat((50 + Math.random() * 35).toFixed(1)) // 50-85%
      }));
      
      // Calculate peak hour performance (average of peak hours)
      const peakHours = mockHourlyData.filter(data => 
        (data.hour >= 7 && data.hour <= 9) || (data.hour >= 16 && data.hour <= 18)
      );
      
      const peakHourPerformance = parseFloat(
        (peakHours.reduce((sum, hour) => sum + hour.utilization, 0) / peakHours.length).toFixed(1)
      );
      
      // Calculate average queue time
      const avgQueueTime = parseFloat(
        (mockHourlyData.reduce((sum, hour) => sum + hour.queueTime, 0) / mockHourlyData.length).toFixed(1)
      );
      
      setSummaryMetrics({
        peakHourPerformance,
        avgQueueTime
      });
      
      setHourlyData(mockHourlyData);
      setGateUtilizationByDay(mockWeeklyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gate utilization metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading gate utilization metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Gate Utilization</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Peak Hour Performance</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.peakHourPerformance}</span>
              <span className="text-xl mb-1">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: ≤ 85%
              {summaryMetrics.peakHourPerformance <= 85 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-red-600">⚠ Above Target</span>
              )}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Average Queue Time</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.avgQueueTime}</span>
              <span className="text-xl mb-1">min</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: ≤ 10 minutes
              {summaryMetrics.avgQueueTime <= 10 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-red-600">⚠ Above Target</span>
              )}
            </p>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Hourly Gate Utilization</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(hour) => `${hour}:00`}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'utilization') return [`${value}%`, 'Utilization'];
                    if (name === 'queueTime') return [`${value} min`, 'Queue Time'];
                    return [value, name];
                  }}
                  labelFormatter={(hour) => `${hour}:00`}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="utilization" 
                  name="Utilization (%)" 
                  stroke="#2563eb" 
                  fill="#93c5fd"
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="queueTime" 
                  name="Queue Time (min)" 
                  stroke="#dc2626" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Gate Utilization by Day</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gateUtilizationByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Utilization']} />
                <Legend />
                <Bar dataKey="utilization" name="Utilization (%)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Utilization Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Add additional staff during peak hours (7-9am and 4-6pm) to improve processing</li>
            <li>Implement appointment scheduling to distribute truck arrivals more evenly</li>
            <li>Consider opening gates earlier to reduce morning peak congestion</li>
            <li>Install additional processing stations to handle peak periods more efficiently</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default function GateUtilizationKPI({ moduleSlug }: GateUtilizationKPIProps) {
  const [kpiMetrics, setKpiMetrics] = useState([
    {
      label: 'Peak Hour Performance',
      value: 0,
      unit: '%',
      target: '≤ 85%',
      color: 'text-blue-600'
    },
    {
      label: 'Avg Queue Time',
      value: 0,
      unit: ' min',
      target: '≤ 10 min',
      color: 'text-amber-600'
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // In a real implementation, this would query the collections
      // related to gate utilization and queue times
      
      // Mock data for demonstration
      setTimeout(() => {
        setKpiMetrics([
          {
            label: 'Peak Hour Performance',
            value: 83.4,
            unit: '%',
            target: '≤ 85%',
            color: 'text-blue-600'
          },
          {
            label: 'Avg Queue Time',
            value: 8.7,
            unit: ' min',
            target: '≤ 10 min',
            color: 'text-amber-600'
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error('Error fetching gate utilization metrics:', error);
    }
  };

  return (
    <ModuleKPICard
      title="Gate Utilization"
      description="Analysis of gate resource utilization, peak hour performance, and queue management"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
} 