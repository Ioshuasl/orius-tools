import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
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

// Componentes Refatorados
import { EditorHeader } from '../components/Editor/EditorHeader';
import { EditorProperties } from '../components/Editor/EditorProperties';
import { FloatingToolbar } from '../components/FloatingToolbar';
import { EditorMenu } from '../components/Editor/EditorMenu';
import { SortableItem } from '../components/Editor/SortableItem';
import { TableOfContents } from '../components/Editor/TableOfContents';

// Hooks Customizados
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useAutoSave } from '../hooks/useAutoSave';

// API e Tipos
import {
  getPageDetailService,
  createPageService,
  getBreadcrumbsService,
  uploadMediaService
} from '../services/api';
import type { CommunityPage, Block, BlockType, BreadcrumbItem } from '../types';
import { parseMarkdownToBlocks } from '../utils/markdownParser';
import { getFilesFromClipboard } from '../utils/clipboardHelper';
import { generatePdfThumbnail } from '../utils/pdfPreviewHandler';

export default function EditorComunidade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Estados Principais
  const [page, setPage] = useState<CommunityPage | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);

  // Estados de UI
  const [slashMenuPos, setSlashMenuPos] = useState<{
    top: number; left: number; index: number; mode: 'replace' | 'add'
  } | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  // Hooks de Lógica Isolada
  const { saveHistory } = useEditorHistory(page, setPage);
  const { isSaving, hasUnsavedChanges, setHasUnsavedChanges } = useAutoSave(page);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Carregamento de Dados ---
  const loadData = useCallback(async (pId: string) => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([getPageDetailService(pId), getBreadcrumbsService(pId)]);
      const data = pRes.data as CommunityPage;

      if (data.content && data.subPages) {
        data.content = data.content.map(block => {
          if (block.type === 'page') {
            const actualSubPage = data.subPages?.find(sp => sp.id === block.data.pageId);
            if (actualSubPage) return { ...block, data: { ...block.data, title: actualSubPage.title } };
          }
          return block;
        });
      }

      if (!data.content || data.content.length === 0) {
        data.content = [{ id: Math.random().toString(36).substring(2, 11), type: 'text', data: { text: "" } }];
      }
      setPage(data);
      setBreadcrumbs(bRes.data as BreadcrumbItem[]);
    } catch (error) {
      toast.error("Erro ao carregar os dados da página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (id) loadData(id); }, [id, loadData]);

  // --- Handlers de Atualização ---
  const handleUpdatePageProperties = useCallback((updates: Partial<CommunityPage>, immediate = true) => {
    if (!page) return;
    saveHistory(page, immediate);
    setPage(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  }, [page, saveHistory, setHasUnsavedChanges]);

  const updateBlock = useCallback((bId: string, newData: any, immediate = false) => {
    setPage(prev => {
      if (!prev) return null;
      const newContent = prev.content.map(b => b.id === bId ? { ...b, data: { ...b.data, ...newData } } : b);
      saveHistory(prev, immediate);
      return { ...prev, content: newContent };
    });
    setHasUnsavedChanges(true);
  }, [saveHistory, setHasUnsavedChanges]);

  const updateBlockType = useCallback((bId: string, nType: string) => {
    setPage(prev => prev ? { ...prev, content: prev.content.map(b => b.id === bId ? { ...b, type: nType as BlockType } : b) } : null);
    setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);

  const removeBlockAndFocusPrev = useCallback((index: number) => {
    if (index === 0 || !page) return;
    saveHistory(page, true);
    const prevBlockId = page.content[index - 1].id;
    setPage(prev => prev ? { ...prev, content: prev.content.filter((_, i) => i !== index) } : null);
    setHasUnsavedChanges(true);
    setFocusBlockId(prevBlockId);
  }, [page, saveHistory, setHasUnsavedChanges]);

  // --- Manipulação de Blocos ---
  const addBlock = useCallback(async (type: BlockType | 'page', index?: number, shouldReplace: boolean = false) => {
    if (!page) return;
    saveHistory(page, true);
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
  }, [page, saveHistory, setHasUnsavedChanges]);

  // --- Drag & Drop ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && page) {
      saveHistory(page, true);
      setPage(prev => {
        if (!prev) return null;
        const oldIndex = prev.content.findIndex(b => b.id === active.id);
        const newIndex = prev.content.findIndex(b => b.id === over.id);
        return { ...prev, content: arrayMove(prev.content, oldIndex, newIndex) };
      });
      setHasUnsavedChanges(true);
    }
  };

  // --- Paste Handler ---
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const clipboardFiles = getFilesFromClipboard(e);

    if (clipboardFiles.length > 0) {
      e.preventDefault();
      for (const item of clipboardFiles) {
        const toastId = toast.loading(`Processando ${item.file.name}...`);
        try {
          let pdfThumbnail: string | null = null;
          if (item.file.type === 'application/pdf') pdfThumbnail = await generatePdfThumbnail(item.file);
          const response = await uploadMediaService(item.file);

          if (response.success && response.url) {
            const newBlockId = Math.random().toString(36).substring(2, 11);
            const newBlock: Block = {
              id: newBlockId, type: item.type,
              data: { url: response.url, filename: response.filename || item.file.name, mimetype: response.mimetype || item.file.type, size: item.file.size, thumbnail: pdfThumbnail }
            };

            setPage(prev => {
              if (!prev) return null;
              const currentIndex = prev.content.findIndex(b => b.id === focusBlockId);
              const insertIndex = currentIndex !== -1 ? currentIndex : prev.content.length - 1;
              const newContent = [...prev.content];
              newContent.splice(insertIndex + 1, 0, newBlock);
              return { ...prev, content: newContent };
            });
            setHasUnsavedChanges(true);
            setFocusBlockId(newBlockId);
            toast.success(`${item.type.toUpperCase()} enviado!`, { id: toastId });
          }
        } catch (error) {
          toast.error("Falha ao processar arquivo colado.", { id: toastId });
        }
      }
      return;
    }

    const pastedText = e.clipboardData.getData('text/plain');
    if (/^[#*>-]|^\d+\.|```/m.test(pastedText) || pastedText.includes('\n')) {
      e.preventDefault();
      const newBlocks = parseMarkdownToBlocks(pastedText);
      if (newBlocks.length === 0) return;

      setPage(prev => {
        if (!prev) return null;
        const currentIndex = prev.content.findIndex(b => b.id === focusBlockId);
        const insertIndex = currentIndex !== -1 ? currentIndex : prev.content.length - 1;
        const newContent = [...prev.content];
        const currentBlock = newContent[insertIndex];
        const isCurrentEmpty = currentBlock?.type === 'text' && !currentBlock.data.text;

        if (isCurrentEmpty) newContent.splice(insertIndex, 1, ...newBlocks);
        else newContent.splice(insertIndex + 1, 0, ...newBlocks);

        return { ...prev, content: newContent };
      });
      setHasUnsavedChanges(true);
      setFocusBlockId(newBlocks[newBlocks.length - 1].id);
    }
  }, [focusBlockId, setHasUnsavedChanges]);

  // --- Toolbar Selection ---
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
        if (showToolbar) setShowToolbar(false);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({ top: rect.top + window.scrollY, left: rect.left + rect.width / 2 });
      if (!showToolbar) setShowToolbar(true);
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [showToolbar]);

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
      <Activity className="text-orange-500 animate-spin" size={32} />
    </div>
  );

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

      <main ref={mainScrollRef} onPaste={handlePaste} className="flex-1 flex flex-col overflow-y-auto scroll-smooth">
        <EditorHeader
          breadcrumbs={breadcrumbs}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onBack={() => navigate('/comunidade')}
        />

        <div className="max-w-4xl mx-auto w-full py-12 px-12 pb-60 relative">
          {page && (
            <EditorProperties
              page={page}
              onChange={handleUpdatePageProperties}
            />
          )}

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
                      if (page && nextIndex >= 0 && nextIndex < page.content.length) {
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