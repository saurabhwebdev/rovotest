'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ModuleKPICardProps {
  title: string;
  description: string;
  metrics: {
    label: string;
    value: number;
    unit: string;
    target: string;
    color: string;
  }[];
  DetailComponent: React.ComponentType<any>;
}

export default function ModuleKPICard({ title, description, metrics, DetailComponent }: ModuleKPICardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card 
        className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowDetails(true)}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
              <p className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}{metric.unit}
              </p>
              <p className="text-xs text-gray-500">Target: {metric.target}</p>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <DetailComponent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 