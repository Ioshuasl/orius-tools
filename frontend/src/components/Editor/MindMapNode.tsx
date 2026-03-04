import { useState, useEffect, useRef } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Plus, CornerDownLeft, Trash2 } from 'lucide-react';

/* =========================
   Tipagem dos Dados do Nó
========================= */
export type MindMapNodeData = {
  label: string;
  isRoot?: boolean;
  collapsed?: boolean;
  color?: string;
  matchingSearch?: boolean; // Destaque de busca
  isDropTarget?: boolean;   // Feedback de reparentar
  // Callbacks de ação
  onChange: (id: string, label: string) => void;
  onToggle: (id: string) => void;
  onAddChild: (id: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
};

// Definindo o tipo aqui mesmo, sem importar de si mesmo
export type MindMapNodeType = Node<MindMapNodeData, 'mindmap'>;

/* =========================
   Componente MindMapNode
========================= */
export function MindMapNode({ data, id, selected }: NodeProps<MindMapNodeType>) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { 
    setTempLabel(data.label); 
  }, [data.label]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.select();
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing]);

  const onBlur = () => {
    setIsEditing(false);
    if (tempLabel.trim() !== "") data.onChange(id, tempLabel);
    else setTempLabel(data.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onBlur();
    }
    if (e.key === 'Escape') {
      setTempLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`group relative px-4 py-2 rounded-lg border-2 transition-all duration-200 min-w-37.5
        ${selected ? 'ring-2 ring-orange-500 ring-offset-2' : 'hover:border-gray-300 dark:hover:border-gray-600'}
        ${data.isRoot ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800'}
        ${data.isDropTarget ? 'border-dashed border-orange-500 scale-105' : ''}
      `}
      style={{ borderColor: !data.isRoot ? data.color : undefined }}
    >
      {/* Classe corrigida: opacity-0! */}
      <Handle type="target" position={Position.Left} className="opacity-0!" />
      
      {/* Toolbar Flutuante do Nó */}
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-1 rounded-md z-50 animate-in fade-in zoom-in duration-150">
          <button onClick={() => data.onAddChild(id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Filho (Tab)">
            <Plus size={14} />
          </button>
          {!data.isRoot && (
            <>
              <button onClick={() => data.onAddSibling(id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300" title="Irmão (Enter)">
                <CornerDownLeft size={14} />
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button onClick={() => data.onDelete(id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Excluir (Del)">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}

      <div onDoubleClick={() => setIsEditing(true)} className="cursor-text">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={tempLabel}
            onChange={(e) => {
              setTempLabel(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none resize-none p-0 text-sm font-medium leading-tight focus:ring-0"
            rows={1}
          />
        ) : (
          <span className="text-sm font-medium whitespace-pre-wrap block leading-tight">
            {data.label}
          </span>
        )}
      </div>

      {/* Indicador de Colapso */}
      {!data.isRoot && (
        <button 
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full border bg-white dark:bg-gray-800 text-[10px] font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderColor: data.color, color: data.color }}
          onClick={(e) => { e.stopPropagation(); data.onToggle(id); }}
        >
          {data.collapsed ? '+' : '−'}
        </button>
      )}

      {/* Classe corrigida: opacity-0! */}
      <Handle type="source" position={Position.Right} className="opacity-0!" />
    </div>
  );
}