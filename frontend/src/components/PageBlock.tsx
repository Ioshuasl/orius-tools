import { FileText, ChevronRight } from 'lucide-react';

interface PageBlockProps {
  title: string;
  onClick: () => void;
}

export function PageBlock({ title, onClick }: PageBlockProps) {
  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-orange-500/50 hover:bg-orange-50/30 dark:hover:bg-orange-500/5 cursor-pointer transition-all my-2 shadow-sm"
    >
      <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
        <FileText size={18} className="text-orange-500" />
      </div>
      <span className="flex-1 font-bold text-sm text-gray-700 dark:text-gray-200">
        {title || 'Página sem título'}
      </span>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
    </div>
  );
}