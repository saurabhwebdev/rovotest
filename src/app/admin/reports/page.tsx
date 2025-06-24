'use client';

import PagePermissionWrapper from "@/components/PagePermissionWrapper";
import TransporterKPISummary from "@/components/reports/TransporterKPISummary";
import OperationalEfficiencyKPI from "@/components/reports/OperationalEfficiencyKPI";
import SchedulingEffectivenessKPI from "@/components/reports/SchedulingEffectivenessKPI";

export default function ReportsPage() {
  return (
    <PagePermissionWrapper pageId="admin-reports">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        <div className="grid gap-6">
          <TransporterKPISummary />
          <OperationalEfficiencyKPI />
          <SchedulingEffectivenessKPI />
          {/* Other module KPIs will be added here */}
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 