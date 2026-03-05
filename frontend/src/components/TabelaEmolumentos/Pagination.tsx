import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: PaginationProps) {
  // Se não houver páginas suficientes, não renderiza nada
  if (totalPages <= 1) return null;

  // Cálculos para o texto de "Mostrando X a Y"
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
      {/* Contador de registros */}
      <span>
        Mostrando <span className="font-medium text-gray-700 dark:text-gray-300">{startItem}</span> a{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{endItem}</span> de{' '}
        <span className="font-medium text-gray-700 dark:text-gray-300">{totalItems}</span>
      </span>

      {/* Controles de Navegação */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página Anterior"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="font-medium text-gray-900 dark:text-white px-2">
          Pág {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Próxima Página"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}