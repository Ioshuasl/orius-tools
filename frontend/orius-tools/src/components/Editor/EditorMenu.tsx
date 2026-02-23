import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Type, Hash, List, ListOrdered, Table, 
  Image as ImageIcon, Video, FilePlus, Code, Search 
} from 'lucide-react';
import type { BlockType } from '../../types';

interface EditorMenuProps {
  addBlock: (type: BlockType | 'page') => void;
}

export function EditorMenu({ addBlock }: EditorMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems = useMemo(() => [
    { label: 'Texto', icon: <Type size={16} />, type: 'text' as BlockType, desc: 'Comece a escrever...', category: 'Básicos' },
    { label: 'Título 1', icon: <Hash size={16} />, type: 'h1' as BlockType, desc: 'Título grande', category: 'Básicos' },
    { label: 'Título 2', icon: <Hash size={16} />, type: 'h2' as BlockType, desc: 'Título médio', category: 'Básicos' },
    { label: 'Título 3', icon: <Hash size={16} />, type: 'h3' as BlockType, desc: 'Título pequeno', category: 'Básicos' },
    { label: 'Lista Simples', icon: <List size={16} />, type: 'bullet_list' as BlockType, desc: 'Marcadores', category: 'Básicos' },
    { label: 'Lista Numerada', icon: <ListOrdered size={16} />, type: 'numbered_list' as BlockType, desc: 'Sequencial', category: 'Básicos' },
    { label: 'Tabela', icon: <Table size={16} />, type: 'table' as BlockType, desc: 'Dados estruturados', category: 'Mídia' },
    { label: 'Código SQL', icon: <Code size={16} />, type: 'code' as BlockType, desc: 'Editor Monaco', category: 'Mídia' },
    { label: 'Imagem', icon: <ImageIcon size={16} />, type: 'image' as BlockType, desc: 'Upload de imagem', category: 'Mídia' },
    { label: 'Vídeo', icon: <Video size={16} />, type: 'video' as BlockType, desc: 'Upload de vídeo', category: 'Mídia' },
    { label: 'Subpágina', icon: <FilePlus size={16} />, type: 'page' as const, desc: 'Criar página filha', category: 'Avançado' },
  ], []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase()) || 
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, menuItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Função centralizada para lidar com o teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation(); // Evita que o evento suba e seja processado novamente
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      addBlock(filteredItems[selectedIndex].type);
    }
  };

  useEffect(() => {
    const selectedElement = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div 
      className="flex flex-col w-64 max-h-80 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2"
      onKeyDown={handleKeyDown} // Captura no container pai
    >
      <div className="px-3 py-2 mb-1 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
        <Search size={14} className="text-gray-400" />
        <input 
          autoFocus
          placeholder="Filtrar blocos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Removemos o onKeyDown daqui para não duplicar o disparo
          className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200 w-full"
        />
      </div>

      <div 
        ref={menuRef}
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600"
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <button
              key={item.label}
              data-index={index}
              onClick={() => addBlock(item.type)}
              className={`flex items-center gap-3 px-3 py-2 transition-colors text-left group w-full
                ${selectedIndex === index 
                  ? 'bg-orange-500/10 dark:bg-orange-500/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}
              `}
            >
              <div className={`p-2 rounded-lg transition-colors
                ${selectedIndex === index 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 group-hover:text-orange-500'}
              `}>
                {item.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold ${selectedIndex === index ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-400 truncate">{item.desc}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Nenhum bloco encontrado
          </div>
        )}
      </div>
    </div>
  );
}