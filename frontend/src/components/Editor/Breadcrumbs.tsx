import { ChevronRight, Home, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BreadcrumbItem } from '../../types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[]; // Aqui virá o array ordenado: [Raiz, Filho, Neto...]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto no-scrollbar py-2 max-w-full">
      {/* Botão Home/Início sempre presente */}
      <button 
        onClick={() => navigate('/comunidade')}
        className="flex items-center gap-1.5 hover:text-orange-500 transition-colors shrink-0 group"
      >
        <Home size={14} className="group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline font-medium">Comunidade</span>
      </button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
          <button
            onClick={() => navigate(`/comunidade/editor/${item.id}`)}
            disabled={index === items.length - 1} // Desabilita o clique na página atual
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              index === items.length - 1 
                ? 'text-gray-900 dark:text-white font-bold cursor-default' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-orange-500'
            }`}
          >
            <FileText size={14} className={index === items.length - 1 ? 'text-orange-500' : 'text-gray-400'} />
            <span className="max-w-[150px] truncate">{item.title}</span>
          </button>
        </div>
      ))}
    </nav>
  );
}