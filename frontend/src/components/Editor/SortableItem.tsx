import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import type { Block, BlockType } from '../../types';

interface SortableItemProps {
    block: Block;
    index: number;
    allBlocks: Block[];
    updateBlock: (id: string, data: any) => void;
    updateBlockType: (id: string, type: string) => void;
    removeBlock: (id: string) => void;
    addBlock: (type: BlockType | 'page', index?: number, shouldReplace?: boolean) => void;
    focusBlockId: string | null;
    onSlash: (index: number, rect: DOMRect, mode: 'replace' | 'add') => void;
    onMoveFocus: (direction: 'up' | 'down') => void;
    onBackspaceEmpty: () => void; // Nova prop para o comportamento de Backspace
    navigate: (path: string) => void;
}

export const SortableItem = memo(({ 
  block, 
  index, 
  allBlocks,
  updateBlock, 
  updateBlockType,
  removeBlock, 
  addBlock, 
  focusBlockId, 
  onSlash, 
  onMoveFocus,
  onBackspaceEmpty, // Recebe a função do EditorComunidade
  navigate 
}: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/block flex items-start gap-2 -ml-12 py-1">
      
      {/* Controles Laterais */}
      <div className="flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity pt-1.5 shrink-0">
        <button 
          onClick={(e) => {
              e.stopPropagation();
              onSlash(index, e.currentTarget.getBoundingClientRect(), 'add');
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-orange-500 transition-colors"
        >
          <Plus size={16} />
        </button>

        {/* GRIP COM DUPLA FUNÇÃO: Drag e Substituição */}
        <div 
          {...attributes} 
          {...listeners} 
          onClick={(e) => {
            e.stopPropagation();
            onSlash(index, e.currentTarget.getBoundingClientRect(), 'replace');
          }}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-700 hover:text-orange-500 transition-all rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <GripVertical size={16} />
        </div>
      </div>

      <div className="flex-1 min-w-0 relative">
          <div className="absolute -right-10 top-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
             <button onClick={() => removeBlock(block.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
               <Trash2 size={14}/>
             </button>
          </div>

          <BlockRenderer 
            block={block} 
            index={index}
            allBlocks={allBlocks}
            updateBlock={updateBlock}
            updateBlockType={(type: string) => updateBlockType(block.id, type)}
            addBlock={addBlock}
            focusBlockId={focusBlockId}
            onSlash={(rect: DOMRect, mode: 'replace' | 'add') => onSlash(index, rect, mode)}
            onMoveFocus={onMoveFocus}
            onBackspaceEmpty={onBackspaceEmpty} // Repassa para o BlockRenderer
            navigate={navigate} 
          />
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.block.data.text === next.block.data.text &&
    prev.block.type === next.block.type &&
    prev.block.data.rows === next.block.data.rows &&
    prev.block.data.language === next.block.data.language &&
    prev.focusBlockId === next.focusBlockId &&
    prev.index === next.index &&
    prev.allBlocks.length === next.allBlocks.length
  );
});