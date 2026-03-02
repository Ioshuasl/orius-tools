import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning';
}

export function StatsCard({ title, value, icon: Icon, variant = 'default' }: StatsCardProps) {
  // Define cores baseadas na variante com suporte ao Dark Mode
  const colorClasses = {
    default: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700',
    warning: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30',
    danger: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-colors duration-200 ${
      variant !== 'default' ? 'border-l-4' : ''
    } ${
      variant === 'warning' ? 'border-l-orange-500 dark:border-l-orange-500' : ''
    } ${
      variant === 'danger' ? 'border-l-red-500 dark:border-l-red-500' : ''
    }`}>
      <div className={`p-3 rounded-lg ${colorClasses[variant]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );
}