import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Buscar código, sistema, ato..." 
}: SearchBarProps) {
  return (
    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
      <div className="relative w-full max-w-sm">
        {/* Ícone de busca posicionado de forma absoluta dentro do input */}
        <Search 
          size={14} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
        />
        
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors placeholder-gray-400"
        />
      </div>
    </div>
  );
}