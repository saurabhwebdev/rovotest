'use client';

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface KPIMetric {
  label: string;
  value: number;
  unit: string;
  target: string;
  color: string;
}

interface ModuleKPICardProps {
  title: string;
  description: string;
  metrics: KPIMetric[];
  moduleSlug: string;
}

export default function ModuleKPICard({ title, description, metrics, moduleSlug }: ModuleKPICardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/admin/reports/${moduleSlug}`);
  };

  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
            <p className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}{metric.unit}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: {metric.target}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
} 