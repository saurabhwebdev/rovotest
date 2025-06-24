'use client';

import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface SimpleKPICardProps {
  title: string;
  value: string;
  trend: number;
  description: string;
  isSimple: true;
}

interface DetailedKPIMetric {
  label: string;
  value: number;
  unit: string;
  target: string;
  color: string;
}

interface DetailedKPICardProps {
  title: string;
  description: string;
  metrics: DetailedKPIMetric[];
  moduleSlug: string;
  isSimple: false;
}

type ModuleKPICardProps = SimpleKPICardProps | DetailedKPICardProps;

export default function ModuleKPICard(props: ModuleKPICardProps) {
  const router = useRouter();

  // Handle detailed KPI card click
  const handleCardClick = () => {
    if ('moduleSlug' in props) {
      router.push(`/admin/reports/${props.moduleSlug}`);
    }
  };

  // Render simple KPI card
  if (props.isSimple) {
    return (
      <Card className="p-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{props.title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {props.value}
            </p>
            {props.trend !== 0 && (
              <span className={`ml-2 text-sm ${props.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {props.trend > 0 ? '↑' : '↓'} {Math.abs(props.trend)}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{props.description}</p>
        </div>
      </Card>
    );
  }

  // Render detailed KPI card
  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleCardClick}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{props.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{props.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {props.metrics.map((metric, index) => (
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