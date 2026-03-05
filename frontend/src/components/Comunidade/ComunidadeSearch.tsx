import { Search, Layout, List } from 'lucide-react';

interface ComunidadeSearchProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedSystem: string;
  onSystemChange: (val: string) => void;
  systems: string[];
  resultsCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ComunidadeSearch({
  searchTerm,
  onSearchChange,
  selectedSystem,
  onSystemChange,
  systems,
  resultsCount,
  viewMode,
  onViewModeChange,
}: ComunidadeSearchProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, conteúdo ou tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
          />
        </div>
        <select
          value={selectedSystem}
          onChange={(e) => onSystemChange(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white min-w-[200px]"
        >
          <option value="">Todos os Sistemas</option>
          {systems.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          {resultsCount} RESULTADOS
        </span>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => onViewModeChange('grid')} 
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <Layout size={16} />
          </button>
          <button 
            onClick={() => onViewModeChange('list')} 
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}