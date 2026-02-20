import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, Activity, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

// DND Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Componentes
import { FloatingToolbar } from '../components/FloatingToolbar';
import { BlockRenderer } from '../components/Editor/BlockRenderer';
import { EditorMenu } from '../components/Editor/EditorMenu';
import { Breadcrumbs } from '../components/Editor/Breadcrumbs';

// API e Tipos
import {
  getPageDetailService,
  updatePage,
  createPageService,
  getBreadcrumbsService
} from '../services/api';
import type { CommunityPage, Block, BlockType, BreadcrumbItem } from '../types';

// --- Sub-componente Memoizado para estabilidade do DOM e Seleção ---
const SortableItem = memo(({
  block,
  index,
  updateBlock,
  updateBlockType,
  removeBlock,
  addBlock,
  focusBlockId,
  onSlash,
  navigate
}: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/block flex items-start gap-2 -ml-12 py-1">

      {/* Controles Laterais (Botão + e Handle de Arraste) */}
      <div className="flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity pt-1.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSlash(index, e.currentTarget.getBoundingClientRect());
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-orange-500 transition-colors"
        >
          <Plus size={16} />
        </button>

        <div
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-700 hover:text-orange-500 transition-all rounded"
        >
          <GripVertical size={16} />
        </div>
      </div>

      {/* Área de Conteúdo do Bloco */}
      <div className="flex-1 min-w-0 relative">
        <div className="absolute -right-10 top-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
          <button onClick={() => removeBlock(block.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <BlockRenderer
          block={block}
          index={index}
          updateBlock={updateBlock}
          updateBlockType={(type: string) => updateBlockType(block.id, type)}
          addBlock={addBlock}
          focusBlockId={focusBlockId}
          onSlash={(rect: DOMRect) => onSlash(index, rect)}
          navigate={navigate}
        />
      </div>
    </div>
  );
}, (prev, next) => {
  // Impede re-render se o conteúdo for idêntico, preservando a seleção do navegador
  return (
    prev.block.data.text === next.block.data.text &&
    prev.block.type === next.block.type &&
    prev.block.data.rows === next.block.data.rows &&
    prev.focusBlockId === next.focusBlockId &&
    prev.index === next.index
  );
});

// --- Componente Principal do Editor ---
export default function EditorComunidade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<CommunityPage | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const [slashMenuPos, setSlashMenuPos] = useState<{ top: number; left: number; index: number } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Lógica de exibição da Floating Toolbar com estabilização de posição
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
      if (showToolbar) setShowToolbar(false);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const newPos = { top: rect.top + window.scrollY, left: rect.left + rect.width / 2 };

    setToolbarPosition(prev => {
      if (prev && Math.abs(prev.top - newPos.top) < 2 && Math.abs(prev.left - newPos.left) < 2) return prev;
      return newPos;
    });
    if (!showToolbar) setShowToolbar(true);
  }, [showToolbar]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [handleSelection]);

  const loadData = useCallback(async (pId: string) => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([getPageDetailService(pId), getBreadcrumbsService(pId)]);
      const data = pRes.data as CommunityPage;
      if (!data.content || data.content.length === 0) {
        data.content = [{ id: Math.random().toString(36).substring(2, 11), type: 'text', data: { text: "" } }];
      }
      setPage(data);
      setBreadcrumbs(bRes.data as BreadcrumbItem[]);
    } catch { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (id) loadData(id); }, [id, loadData]);

  // Handlers memoizados para garantir que SortableItem não re-renderize sem necessidade
  const updateBlock = useCallback((bId: string, newData: any) => {
    setPage(prev => prev ? { ...prev, content: prev.content.map(b => b.id === bId ? { ...b, data: { ...b.data, ...newData } } : b) } : null);
  }, []);

  const updateBlockType = useCallback((bId: string, nType: string) => {
    setPage(prev => prev ? { ...prev, content: prev.content.map(b => b.id === bId ? { ...b, type: nType as BlockType } : b) } : null);
  }, []);

  const removeBlock = useCallback((bId: string) => {
    setPage(prev => (!prev || prev.content.length <= 1) ? prev : { ...prev, content: prev.content.filter(b => b.id !== bId) });
  }, []);

  // Lógica de adição/substituição de blocos (Slash Command vs Enter)
  const addBlock = useCallback(async (type: BlockType | 'page', index?: number, shouldReplace: boolean = false) => {
    if (!page) return;

    const newId = Math.random().toString(36).substring(2, 11);
    let newBlock: Block;

    // Lógica de criação de novos blocos ou subpáginas
    if (type === 'page') {
      try {
        const res = await createPageService({
          title: "Nova Subpágina",
          parentId: page.id,
          system: page.system,
          content: [{ id: Math.random().toString(36).substring(2, 11), type: 'text', data: { text: "" } }]
        });
        const newPageData = res.data as CommunityPage;
        newBlock = { id: newId, type: 'page', data: { pageId: newPageData.id, title: newPageData.title } };
      } catch {
        return toast.error("Falha ao criar subpágina.");
      }
    } else {
      // Ao criar um novo bloco (especialmente via Slash Menu), garantimos que o data.text venha vazio
      newBlock = {
        id: newId,
        type: type as BlockType,
        data: type === 'table' ? { rows: [["", ""], ["", ""]] } : { text: "" }
      };
    }

    setPage(prev => {
      if (!prev) return null;
      const newContent = [...prev.content];

      if (typeof index === 'number') {
        if (shouldReplace) {
          // SUBSTITUIÇÃO (Comportamento Slash Menu): 
          // Troca o bloco atual (que contém o '/') pelo novo bloco limpo
          newContent[index] = newBlock;
        } else {
          // INSERÇÃO (Comportamento Enter): 
          // Adiciona um novo bloco na posição seguinte
          newContent.splice(index + 1, 0, newBlock);
        }
      } else {
        newContent.push(newBlock);
      }

      return { ...prev, content: newContent };
    });

    // Define o foco no novo bloco criado ou transformado
    setFocusBlockId(newId);
    setSlashMenuPos(null);
  }, [page]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPage(prev => {
        if (!prev) return null;
        const oldIndex = prev.content.findIndex(b => b.id === active.id);
        const newIndex = prev.content.findIndex(b => b.id === over.id);
        return { ...prev, content: arrayMove(prev.content, oldIndex, newIndex) };
      });
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center dark:bg-gray-900"><Activity className="text-orange-500 animate-spin" size={32} /></div>;

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden relative" onClick={() => setSlashMenuPos(null)}>

      <FloatingToolbar position={toolbarPosition} isVisible={showToolbar} />

      {slashMenuPos && (
        <div className="fixed z-50 animate-in fade-in zoom-in duration-150" style={{ top: slashMenuPos.top, left: slashMenuPos.left }} onClick={(e) => e.stopPropagation()}>
          <EditorMenu addBlock={(type) => addBlock(type, slashMenuPos.index, true)} />
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-40">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button onClick={() => navigate('/comunidade')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"><ArrowLeft size={18} /></button>
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <button onClick={async () => { if (page) { await updatePage(page.id, page); toast.success("Manual salvo!"); } }} className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md">
            <Save size={16} /> Salvar
          </button>
        </header>

        <div className="max-w-4xl mx-auto w-full py-12 px-12 pb-60">
          <input
            value={page?.title || ''}
            onChange={(e) => setPage(p => p ? { ...p, title: e.target.value } : null)}
            className="w-full bg-transparent border-none outline-none font-black text-4xl text-gray-900 dark:text-white mb-8 placeholder:text-gray-200 focus:ring-0"
            placeholder="Título do manual..."
          />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={page?.content.map(b => b.id) || []} strategy={verticalListSortingStrategy}>
              {page?.content.map((block, index) => (
                <SortableItem
                  key={block.id}
                  block={block}
                  index={index}
                  updateBlock={updateBlock}
                  updateBlockType={updateBlockType}
                  removeBlock={removeBlock}
                  addBlock={addBlock}
                  focusBlockId={focusBlockId}
                  onSlash={(idx: number, rect: DOMRect) => setSlashMenuPos({ top: rect.top + window.scrollY + 24, left: rect.left, index: idx })}
                  navigate={navigate}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </div>
  );
}