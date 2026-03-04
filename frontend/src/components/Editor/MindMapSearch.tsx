import { Search, X } from 'lucide-react';

interface SearchProps {
  value: string;
  onChange: (val: string) => void;
}

/**
 * Componente de busca para o Bloco de Mapa Mental.
 * Posicionado de forma absoluta para flutuar sobre o canvas do React Flow.
 */
export function MindMapSearch({ value, onChange }: SearchProps) {
  return (
    <div className="absolute top-4 left-4 z-50 w-64 group">
      <div className="relative flex items-center">
        {/* Ícone de Busca */}
        <div className="absolute left-3 text-gray-400 group-focus-within:text-orange-500 transition-colors">
          <Search size={16} />
        </div>

        <input 
          type="text" 
          placeholder="Buscar no mapa..." 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-full text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />

        {/* Botão de Limpar (SÓ aparece se houver texto) */}
        {value && (
          <button 
            onClick={() => onChange("")}
            className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Indicador de Atalho (Opcional) */}
      {!value && (
        <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none hidden group-focus-within:hidden sm:block">
          <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
            /
          </kbd>
        </div>
      )}
    </div>
  );
}