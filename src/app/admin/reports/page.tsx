'use client';

import { Card } from "@/components/ui/card";
import PagePermissionWrapper from "@/components/PagePermissionWrapper";

export default function ReportsPage() {
  return (
    <PagePermissionWrapper pageId="admin-reports">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Reports Dashboard</h1>
        <Card className="p-6">
          <div className="grid gap-6">
            {/* KPIs will be added here */}
          </div>
        </Card>
      </div>
    </PagePermissionWrapper>
  );
} 