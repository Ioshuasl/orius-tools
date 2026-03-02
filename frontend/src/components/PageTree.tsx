import { FileSearch, Plus } from "lucide-react";

interface PageTreeProps {
  currentPageId: string;
  subpages: any[];
  onSelectPage: (id: string) => void;
  onCreateSubpage: () => void;
}

export function PageTree({ currentPageId, subpages, onSelectPage, onCreateSubpage }: PageTreeProps) {
  return (
    <div className="w-64 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/30 dark:bg-gray-900/30">
      <div className="p-4 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subpáginas</span>
        <button 
          onClick={onCreateSubpage}
          className="p-1 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 rounded-md transition-colors"
          title="Nova Subpágina"
        >
          <Plus size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {subpages.length === 0 && (
          <p className="text-[11px] text-gray-400 px-3 italic">Nenhuma subpágina criada.</p>
        )}
        
        {subpages.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelectPage(sub.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              sub.id === currentPageId 
                ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm font-bold' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            <FileSearch size={14} className={sub.id === currentPageId ? 'text-orange-500' : 'text-gray-400'} />
            <span className="truncate">{sub.title || 'Sem título'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}