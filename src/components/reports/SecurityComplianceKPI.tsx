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
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SecurityIncident {
  id: string;
  date: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface ComplianceData {
  date: string;
  documentVerificationRate: number;
  incidentCount: number;
}

interface SummaryMetrics {
  documentVerificationRate: number;
  securityIncidentCount: number;
}

interface SecurityComplianceKPIProps {
  moduleSlug: string;
}

export const SecurityComplianceDetails = () => {
  const [loading, setLoading] = useState(true);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    documentVerificationRate: 0,
    securityIncidentCount: 0
  });
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [documentTypeData, setDocumentTypeData] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Simulate fetching data from Firestore
      // In a real implementation, this would query collections related to security incidents and document verification
      
      // Mock data for the KPI details page
      const today = new Date();
      const mockComplianceData: ComplianceData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Generate some random but realistic data
        const verificationRate = 95 + Math.random() * 5; // Between 95-100%
        const incidentCount = Math.floor(Math.random() * 2); // Between 0-1 incidents per day
        
        mockComplianceData.push({
          date: dateStr,
          documentVerificationRate: parseFloat(verificationRate.toFixed(1)),
          incidentCount
        });
      }
      
      // Calculate summary metrics
      const documentVerificationRate = parseFloat(
        (mockComplianceData.reduce((sum, day) => sum + day.documentVerificationRate, 0) / mockComplianceData.length).toFixed(1)
      );
      
      const securityIncidentCount = mockComplianceData.reduce((sum, day) => sum + day.incidentCount, 0);
      
      // Mock security incidents
      const mockIncidents: SecurityIncident[] = [
        {
          id: '1',
          date: subDays(today, 2).toLocaleDateString(),
          type: 'Unauthorized Access Attempt',
          description: 'Driver attempted to enter without proper clearance',
          severity: 'medium'
        },
        {
          id: '2',
          date: subDays(today, 4).toLocaleDateString(),
          type: 'Documentation Discrepancy',
          description: 'Suspected forged transportation permit',
          severity: 'high'
        },
        {
          id: '3',
          date: subDays(today, 6).toLocaleDateString(),
          type: 'Prohibited Item',
          description: 'Prohibited item found during vehicle inspection',
          severity: 'low'
        }
      ];
      
      // Document type verification distribution
      const mockDocumentTypeData = [
        { name: 'Driver\'s License', value: 98.7 },
        { name: 'Vehicle Registration', value: 97.2 },
        { name: 'Insurance', value: 96.5 },
        { name: 'Entry Authorization', value: 99.1 }
      ];
      
      setSummaryMetrics({
        documentVerificationRate,
        securityIncidentCount
      });
      
      setComplianceData(mockComplianceData);
      setIncidents(mockIncidents);
      setDocumentTypeData(mockDocumentTypeData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching security compliance metrics:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return <div className="text-center py-8">Loading security compliance metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Security Compliance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Document Verification Rate</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.documentVerificationRate}</span>
              <span className="text-xl mb-1">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: 100%
              {summaryMetrics.documentVerificationRate === 100 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-yellow-600">⚠ Near Target</span>
              )}
            </p>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Security Incidents</h3>
            <div className="flex items-end space-x-2">
              <span className="text-4xl font-bold">{summaryMetrics.securityIncidentCount}</span>
              <span className="text-xl mb-1">incidents</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Target: 0 incidents
              {summaryMetrics.securityIncidentCount === 0 ? (
                <span className="ml-2 text-green-600">✓ On Target</span>
              ) : (
                <span className="ml-2 text-red-600">⚠ Above Target</span>
              )}
            </p>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Daily Compliance Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[90, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 3]} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="documentVerificationRate" 
                  name="Document Verification Rate (%)" 
                  stroke="#16a34a" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="incidentCount" 
                  name="Security Incidents" 
                  stroke="#dc2626" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Document Verification by Type</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={documentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {documentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Security Incidents</h3>
            {incidents.length > 0 ? (
              <div className="space-y-4 max-h-[250px] overflow-y-auto">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{incident.type}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{incident.date}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-green-600">No security incidents reported</p>
              </div>
            )}
          </div>
        </div>
        
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Security Recommendations</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Implement random secondary inspections to enhance security protocols</li>
            <li>Conduct regular training for gate staff on identifying fraudulent documentation</li>
            <li>Enhance communication with security team for rapid response to incidents</li>
            <li>Consider implementing AI-assisted document verification for higher accuracy</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default function SecurityComplianceKPI({ moduleSlug }: SecurityComplianceKPIProps) {
  const [kpiMetrics, setKpiMetrics] = useState([
    {
      label: 'Document Verification',
      value: 0,
      unit: '%',
      target: '100%',
      color: 'text-green-600'
    },
    {
      label: 'Security Incidents',
      value: 0,
      unit: '',
      target: '0 incidents',
      color: 'text-red-600'
    }
  ]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // In a real implementation, this would query the security incidents
      // and document verification collections
      
      // Mock data for demonstration
      setTimeout(() => {
        setKpiMetrics([
          {
            label: 'Document Verification',
            value: 98.2,
            unit: '%',
            target: '100%',
            color: 'text-green-600'
          },
          {
            label: 'Security Incidents',
            value: 3,
            unit: '',
            target: '0 incidents',
            color: 'text-red-600'
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error('Error fetching security metrics:', error);
    }
  };

  return (
    <ModuleKPICard
      title="Security Compliance"
      description="Analysis of document verification rates and security incident tracking"
      metrics={kpiMetrics}
      moduleSlug={moduleSlug}
    />
  );
} 