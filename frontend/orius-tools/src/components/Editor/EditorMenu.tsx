import { 
  Type, Hash, List, ListOrdered, Table, 
  Image as ImageIcon, Video, FilePlus, Code 
} from 'lucide-react';
import type { BlockType } from '../../types';

interface EditorMenuProps {
  addBlock: (type: BlockType | 'page') => void;
}

export function EditorMenu({ addBlock }: EditorMenuProps) {
  const menuItems = [
    { label: 'Texto', icon: <Type size={16} />, type: 'text' as BlockType, desc: 'Comece a escrever...' },
    { label: 'Título 1', icon: <Hash size={16} />, type: 'h1' as BlockType, desc: 'Título grande' },
    { label: 'Título 2', icon: <Hash size={16} />, type: 'h2' as BlockType, desc: 'Título médio' },
    { label: 'Lista Simples', icon: <List size={16} />, type: 'bullet_list' as BlockType, desc: 'Marcadores' },
    { label: 'Lista Numerada', icon: <ListOrdered size={16} />, type: 'numbered_list' as BlockType, desc: 'Sequencial' },
    { label: 'Tabela', icon: <Table size={16} />, type: 'table' as BlockType, desc: 'Dados estruturados' },
    { label: 'Código SQL', icon: <Code size={16} />, type: 'code' as BlockType, desc: 'Editor Monaco' },
    { label: 'Imagem', icon: <ImageIcon size={16} />, type: 'image' as BlockType, desc: 'Upload de imagem' },
    { label: 'Vídeo', icon: <Video size={16} />, type: 'video' as BlockType, desc: 'Upload de vídeo' },
    { label: 'Subpágina', icon: <FilePlus size={16} />, type: 'page' as const, desc: 'Criar página filha' },
  ];

  return (
    <div className="flex flex-col w-64 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
      <div className="px-3 py-1 mb-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blocos Básicos</span>
      </div>
      {menuItems.map((item) => (
        <button
          key={item.label}
          onClick={() => addBlock(item.type)}
          className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors text-left group"
        >
          <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors">
            {item.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
            <span className="text-[10px] text-gray-400 truncate">{item.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}