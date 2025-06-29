'use client';

import { useParams } from 'next/navigation';
import PagePermissionWrapper from "@/components/PagePermissionWrapper";
import TransporterKPIDetails from "@/components/reports/TransporterKPIDetails";
import DockKPIDetails from "@/components/reports/DockKPIDetails";
import { OperationalEfficiencyDetails } from "@/components/reports/OperationalEfficiencyKPI";
import { SchedulingEffectivenessDetails } from "@/components/reports/SchedulingEffectivenessKPI";
import { EntryProcessingEfficiencyDetails } from "@/components/reports/EntryProcessingEfficiencyKPI";
import { SecurityComplianceDetails } from "@/components/reports/SecurityComplianceKPI";
import { GateUtilizationDetails } from "@/components/reports/GateUtilizationKPI";

export default function ModuleKPIDetailsPage() {
  const params = useParams();
  const module = params.module as string;

  const getDetailsComponent = () => {
    switch (module) {
      // Transporter Module KPIs
      case 'transporter':
        return <TransporterKPIDetails />;
      case 'operational-efficiency':
        return <OperationalEfficiencyDetails />;
      case 'scheduling-effectiveness':
        return <SchedulingEffectivenessDetails />;
        
      // Dock Module KPIs
      case 'dock':
        return <DockKPIDetails />;
        
      // Gate Operations KPIs  
      case 'entry-processing-efficiency':
        return <EntryProcessingEfficiencyDetails />;
      case 'security-compliance':
        return <SecurityComplianceDetails />;
      case 'gate-utilization':
        return <GateUtilizationDetails />;
        
      default:
        return <div>Module not found</div>;
    }
  };

  return (
    <PagePermissionWrapper pageId="admin-reports">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <a 
            href="/admin/reports" 
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Reports
          </a>
        </div>
        {getDetailsComponent()}
      </div>
    </PagePermissionWrapper>
  );
} 