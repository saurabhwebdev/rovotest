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
  Bar
} from 'recharts';

interface TruckData {
  id: string;
  truckNumber: string;
  driverName: string;
  transporterName: string;
  action: string;
  timestamp: any;
  processingTime?: number; // in minutes
  verificationResult: string;
}

interface SummaryMetrics {
  avgProcessingTime: number;
  firstTimeVerificationRate: number;
}

interface DailyMetrics {
  date: string;
  avgProcessingTime: number;
  firstTimeVerificationRate: number;
  totalProcessed: number;
}

interface EntryProcessingEfficiencyKPIProps {
  moduleSlug: string;
}

export const EntryProcessingEfficiencyDetails = () => {
  const [loading, setLoading] = useState(true);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    avgProcessingTime: 0,
    firstTimeVerificationRate: 0
  });
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [processingTimeDistribution, setProcessingTimeDistribution] = useState<{time: string, count: number}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Simulate fetching data from Firestore
      // In a real implementation, this would query the gateGuardAudit collection
      
      // Mock data for the KPI details page
      const today = new Date();
      const mockDailyData: DailyMetrics[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Generate some random but realistic data
        const avgTime = 3 + Math.random() * 4; // Between 3-7 minutes
        const verificationRate = 75 + Math.random() * 20; // Between 75-95%
        const totalProcessed = 30 + Math.floor(Math.random() * 50); // Between 30-80 trucks
        
        mockDailyData.push({
          date: dateStr,
          avgProcessingTime: parseFloat(avgTime.toFixed(1)),
          firstTimeVerificationRate: parseFloat(verificationRate.toFixed(1)),
          totalProcessed
        });
      }
      
      // Calculate summary metrics (average of daily metrics)
      const avgProcessingTime = parseFloat(
        (mockDailyData.reduce((sum, day) => sum + day.avgProcessingTime, 0) / mockDailyData.length).toFixed(1)
      );
      
      const firstTimeVerificationRate = parseFloat(
        (mockDailyData.reduce((sum, day) => sum + day.firstTimeVerificationRate, 0) / mockDailyData.length).toFixed(1)
      );
      
      // Processing time distribution
      const mockDistribution = [
        { time: '< 3 min', count: 42 },
        { time: '3-5 min', count: 78 },
        { time: '5-7 min', count: 35 },
        { time: '7-10 min', count: 18 },
        { time: '> 10 min', count: 7 }
      ];
      
      setSummaryMetrics({
        avgProcessingTime,
        firstTimeVerificationRate
      });
      
      setDailyMetrics(mockDailyData);
      setProcessingTimeDistribution(mockDistribution);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gate guard metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading entry processing efficiency metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Entry Processing Efficiency</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Average Processing Time</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.avgProcessingTime}</span>
              <span className="text-xl mb-1">min</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: ≤ 5 minutes
              {summaryMetrics.avgProcessingTime <= 5 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-red-600">⚠ Above Target</span>
              )}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">First-Time Verification Rate</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.firstTimeVerificationRate}</span>
              <span className="text-xl mb-1">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: ≥ 90%
              {summaryMetrics.firstTimeVerificationRate >= 90 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-red-600">⚠ Below Target</span>
              )}
            </p>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Daily Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgProcessingTime" 
                  name="Avg Processing Time (min)" 
                  stroke="#2563eb" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="firstTimeVerificationRate" 
                  name="First-Time Verification (%)" 
                  stroke="#16a34a" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Processing Time Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Number of Trucks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Consider adding more staff during peak hours to reduce processing times</li>
            <li>Implement pre-arrival document verification to improve first-time verification rates</li>
            <li>Provide clearer instructions to transporters about required documentation</li>
            <li>Train gate staff on efficient verification procedures</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default function EntryProcessingEfficiencyKPI({ moduleSlug }: EntryProcessingEfficiencyKPIProps) {
  const [kpiMetrics, setKpiMetrics] = useState([
    {
      label: 'Avg Processing Time',
      value: 0,
      unit: ' min',
      target: '≤ 5 min',
      color: 'text-blue-600'
    },
    {
      label: 'First-Time Verification',
      value: 0,
      unit: '%',
      target: '≥ 90%',
      color: 'text-green-600'
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // In a real implementation, this would query the gateGuardAudit collection
      // and calculate the metrics based on real data
      
      // Mock data for demonstration
      setTimeout(() => {
        setKpiMetrics([
          {
            label: 'Avg Processing Time',
            value: 4.2,
            unit: ' min',
            target: '≤ 5 min',
            color: 'text-blue-600'
          },
          {
            label: 'First-Time Verification',
            value: 87.5,
            unit: '%',
            target: '≥ 90%',
            color: 'text-green-600'
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error('Error fetching gate metrics:', error);
    }
  };

  return (
    <ModuleKPICard
      title="Entry Processing Efficiency"
      description="Analysis of truck entry processing speed and first-time verification success rates"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
}