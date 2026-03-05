import { Plus, MessageSquare } from 'lucide-react';

interface ComunidadeHeaderProps {
  onCreateNew: () => void;
}

export function ComunidadeHeader({ onCreateNew }: ComunidadeHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg text-orange-600 dark:text-orange-400">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Comunidade de Suporte</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Base de conhecimento técnica Orius</p>
        </div>
      </div>
      <button 
        onClick={onCreateNew} 
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all shadow-orange-500/20"
      >
        <Plus size={18} /> Nova Publicação
      </button>
    </div>
  );
}