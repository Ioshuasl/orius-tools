import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, CloudCheck, CloudUpload, AlertTriangle } from 'lucide-react';
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
} from '@dnd-kit/sortable';

// Componentes
import { FloatingToolbar } from '../components/FloatingToolbar';
import { EditorMenu } from '../components/Editor/EditorMenu';
import { Breadcrumbs } from '../components/Editor/Breadcrumbs';
import { SortableItem } from '../components/Editor/SortableItem';
import { TableOfContents } from '../components/Editor/TableOfContents';

// API e Tipos
import {
  getPageDetailService,
  updatePage,
  createPageService,
  getBreadcrumbsService
} from '../services/api';
import type { CommunityPage, Block, BlockType, BreadcrumbItem } from '../types';

export default function EditorComunidade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState<CommunityPage | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);

  // Estados de Salvamento
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [slashMenuPos, setSlashMenuPos] = useState<{
    top: number;
    left: number;
    index: number;
    mode: 'replace' | 'add'
  } | null>(null);

  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Função Central de Salvamento ---
  const persistData = useCallback(async (currentPage: CommunityPage) => {
    setIsSaving(true);
    try {
      await updatePage(currentPage.id, currentPage);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      // Não exibimos toast no autosave para não interromper o fluxo, apenas no log
    } finally {
      setIsSaving(false);
    }
  }, []);

  // --- Lógica de Salvamento Automático e Unmount ---
  useEffect(() => {
    if (!hasUnsavedChanges || !page) return;

    const timer = setTimeout(() => {
      persistData(page);
    }, 2500); // 2.5s de respiro

    return () => {
      clearTimeout(timer);
      if (hasUnsavedChanges) {
        updatePage(page.id, page).catch(err => console.error("Save on unmount failed", err));
      }
    };
  }, [page, hasUnsavedChanges, persistData]);

  // --- Bloqueio de Saída do Navegador ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
      if (showToolbar) setShowToolbar(false);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setToolbarPosition({ top: rect.top + window.scrollY, left: rect.left + rect.width / 2 });
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
    } catch { toast.error("Erro ao carregar."); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (id) loadData(id); }, [id, loadData]);

  const updateBlock = useCallback((bId: string, newData: any) => {
    setPage(prev => prev ? { ...prev, content: prev.content.map(b => b.id === bId ? { ...b, data: { ...b.data, ...newData } } : b) } : null);
    setHasUnsavedChanges(true);
  }, []);

  const updateBlockType = useCallback((bId: string, nType: string) => {
    setPage(prev => prev ? { ...prev, content: prev.content.map(b => b.id === bId ? { ...b, type: nType as BlockType } : b) } : null);
    setHasUnsavedChanges(true);
  }, []);

  const removeBlockAndFocusPrev = useCallback((index: number) => {
    if (index === 0 || !page) return;
    const prevBlockId = page.content[index - 1].id;
    setPage(prev => prev ? { ...prev, content: prev.content.filter((_, i) => i !== index) } : null);
    setHasUnsavedChanges(true);
    setFocusBlockId(prevBlockId);
  }, [page]);

  const addBlock = useCallback(async (type: BlockType | 'page', index?: number, shouldReplace: boolean = false) => {
    if (!page) return;
    const newId = Math.random().toString(36).substring(2, 11);
    let newBlock: Block;

    if (type === 'page') {
      try {
        const res = await createPageService({
          title: "Nova Subpágina",
          parentId: page.id,
          system: page.system,
          content: [{ id: 'init', type: 'text', data: { text: "" } }]
        });
        newBlock = { id: newId, type: 'page', data: { pageId: (res.data as CommunityPage).id, title: "Nova Subpágina" } };
      } catch { return toast.error("Erro ao criar subpágina."); }
    } else {
      newBlock = { id: newId, type: type as BlockType, data: type === 'table' ? { rows: [["", ""], ["", ""]] } : { text: "" } };
    }

    setPage(prev => {
      if (!prev) return null;
      const newContent = [...prev.content];
      if (typeof index === 'number') {
        if (shouldReplace) {
          const oldData = newContent[index].data;
          if (type !== 'table' && type !== 'page' && type !== 'image' && type !== 'video') {
            newBlock.data = { ...newBlock.data, text: oldData.text || "" };
          }
          newContent[index] = newBlock;
        } else {
          newContent.splice(index + 1, 0, newBlock);
        }
      } else {
        newContent.push(newBlock);
      }
      return { ...prev, content: newContent };
    });

    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900"><Activity className="text-orange-500 animate-spin" size={32} /></div>;

  return (
    <div className="flex h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden relative" onClick={() => setSlashMenuPos(null)}>
      <FloatingToolbar position={toolbarPosition} isVisible={showToolbar} />

      <TableOfContents 
        blocks={page?.content || []} 
        onScrollToBlock={(id) => {
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setFocusBlockId(id);
        }} 
        scrollContainerRef={mainScrollRef} 
      />

      {slashMenuPos && (
        <div className="fixed z-[9999] animate-in fade-in zoom-in duration-150" style={{ top: slashMenuPos.top, left: slashMenuPos.left }} onClick={(e) => e.stopPropagation()}>
          <EditorMenu addBlock={(type) => addBlock(type, slashMenuPos.index, slashMenuPos.mode === 'replace')} />
        </div>
      )}

      <main ref={mainScrollRef} className="flex-1 flex flex-col overflow-y-auto scroll-smooth">
        <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-40">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button onClick={() => navigate('/comunidade')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
              <ArrowLeft size={18} />
            </button>
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* NOVO INDICADOR DE STATUS (No lugar do botão de salvar) */}
          <div className="flex items-center gap-3 pr-2">
            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-300 border ${
                isSaving ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 text-orange-500' : 
                hasUnsavedChanges ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-500' : 
                'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 text-gray-400'
            }`}>
              {isSaving ? (
                <> <CloudUpload size={14} className="animate-bounce" /> Salvando... </>
              ) : hasUnsavedChanges ? (
                <> <AlertTriangle size={14} className="animate-pulse" /> Alterações Locais </>
              ) : (
                <> <CloudCheck size={14} className="text-green-500" /> Sincronizado </>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto w-full py-12 px-12 pb-60 relative">
          <input
            value={page?.title || ''}
            onChange={(e) => { setPage(p => p ? { ...p, title: e.target.value } : null); setHasUnsavedChanges(true); }}
            className="w-full bg-transparent border-none outline-none font-black text-4xl text-gray-900 dark:text-white mb-8 focus:ring-0 placeholder:text-gray-100 dark:placeholder:text-gray-800"
            placeholder="Título da Página..."
          />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={page?.content.map(b => b.id) || []} strategy={verticalListSortingStrategy}>
              {page?.content.map((block, index) => (
                <div key={block.id} data-id={block.id}>
                  <SortableItem
                    block={block}
                    index={index}
                    allBlocks={page.content}
                    updateBlock={updateBlock}
                    updateBlockType={updateBlockType}
                    removeBlock={(id) => {
                        setPage(prev => prev ? { ...prev, content: prev.content.filter(b => b.id !== id) } : null);
                        setHasUnsavedChanges(true);
                    }}
                    addBlock={addBlock}
                    focusBlockId={focusBlockId}
                    onMoveFocus={(dir) => {
                        const nextIndex = dir === 'up' ? index - 1 : index + 1;
                        if (nextIndex >= 0 && nextIndex < page.content.length) {
                            setFocusBlockId(page.content[nextIndex].id);
                        }
                    }}
                    onBackspaceEmpty={() => removeBlockAndFocusPrev(index)}
                    onSlash={(idx: number, rect: DOMRect, mode: 'replace' | 'add') => {
                      setSlashMenuPos({ top: rect.top + window.scrollY + 24, left: rect.left, index: idx, mode });
                    }}
                    navigate={navigate}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </main>
    </div>
  );
}