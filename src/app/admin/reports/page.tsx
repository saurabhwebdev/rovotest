'use client';

import { useState } from 'react';
import PagePermissionWrapper from "@/components/PagePermissionWrapper";
import TransporterKPISummary from "@/components/reports/TransporterKPISummary";
import DockKPISummary from "@/components/reports/DockKPISummary";
import OperationalEfficiencyKPI from "@/components/reports/OperationalEfficiencyKPI";
import SchedulingEffectivenessKPI from "@/components/reports/SchedulingEffectivenessKPI";
import EntryProcessingEfficiencyKPI from "@/components/reports/EntryProcessingEfficiencyKPI";
import SecurityComplianceKPI from "@/components/reports/SecurityComplianceKPI";
import GateUtilizationKPI from "@/components/reports/GateUtilizationKPI";
import WeighbridgeKPIDetails from "@/components/reports/WeighbridgeKPIDetails";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ReportsPage() {
  const [dateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    endDate: new Date()
  });

  return (
    <PagePermissionWrapper pageId="admin-reports">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Performance Reports</h1>
        
        <Tabs defaultValue="transporter" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transporter">Transporter</TabsTrigger>
            <TabsTrigger value="dock">Dock</TabsTrigger>
            <TabsTrigger value="gate">Gate</TabsTrigger>
            <TabsTrigger value="weighbridge">Weighbridge</TabsTrigger>
          </TabsList>

          <TabsContent value="transporter" className="space-y-6">
            <TransporterKPISummary moduleSlug="transporter" />
            <OperationalEfficiencyKPI moduleSlug="operational-efficiency" />
            <SchedulingEffectivenessKPI moduleSlug="scheduling-effectiveness" />
          </TabsContent>

          <TabsContent value="dock" className="space-y-6">
            <DockKPISummary moduleSlug="dock" />
          </TabsContent>

          <TabsContent value="gate" className="space-y-6">
            <EntryProcessingEfficiencyKPI moduleSlug="entry-processing-efficiency" />
            <SecurityComplianceKPI moduleSlug="security-compliance" />
            <GateUtilizationKPI moduleSlug="gate-utilization" />
          </TabsContent>

          <TabsContent value="weighbridge" className="space-y-6">
            <WeighbridgeKPIDetails 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PagePermissionWrapper>
  );
} 