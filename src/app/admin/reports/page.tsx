'use client';

import { useState } from 'react';
import PagePermissionWrapper from "@/components/PagePermissionWrapper";
import TransporterKPISummary from "@/components/reports/TransporterKPISummary";
import OperationalEfficiencyKPI from "@/components/reports/OperationalEfficiencyKPI";
import SchedulingEffectivenessKPI from "@/components/reports/SchedulingEffectivenessKPI";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <PagePermissionWrapper pageId="admin-reports">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        
        <Tabs defaultValue="transporter" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="transporter">Transporter Module</TabsTrigger>
            <TabsTrigger value="gate" disabled>Gate Operations</TabsTrigger>
            <TabsTrigger value="dock" disabled>Dock Operations</TabsTrigger>
            <TabsTrigger value="weighbridge" disabled>Weighbridge</TabsTrigger>
          </TabsList>

          <TabsContent value="transporter" className="space-y-6">
            <div className="grid gap-6">
              <TransporterKPISummary moduleSlug="transporter" />
              <OperationalEfficiencyKPI moduleSlug="operational-efficiency" />
              <SchedulingEffectivenessKPI moduleSlug="scheduling-effectiveness" />
            </div>
          </TabsContent>

          <TabsContent value="gate">
            <div className="text-center py-8 text-gray-500">
              Gate Operations KPIs coming soon
            </div>
          </TabsContent>

          <TabsContent value="dock">
            <div className="text-center py-8 text-gray-500">
              Dock Operations KPIs coming soon
            </div>
          </TabsContent>

          <TabsContent value="weighbridge">
            <div className="text-center py-8 text-gray-500">
              Weighbridge KPIs coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PagePermissionWrapper>
  );
} 