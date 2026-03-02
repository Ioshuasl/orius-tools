import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: string;
}> = ({ title, icon: Icon, children, badge }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mb-3 border rounded-[1.5rem] overflow-hidden transition-all ${
      isOpen 
        ? 'border-orange-200 dark:border-orange-900/30 bg-white dark:bg-gray-800 shadow-sm' 
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left ${
          isOpen ? 'bg-orange-50/50 dark:bg-orange-900/10 border-b border-gray-100 dark:border-gray-700' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-orange-500 text-white' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'}`}>
            <Icon size={18} />
          </div>
          <span className={`font-bold text-sm leading-tight ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="hidden sm:inline-block bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[10px] px-2 py-0.5 rounded-lg uppercase font-black tracking-widest">
              {badge}
            </span>
          )}
          {isOpen ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};