import { useState, useCallback, useRef, useEffect } from 'react';
import type { CommunityPage } from '../types';

/**
 * Hook para gerenciar o histórico de alterações (Undo/Redo) do editor.
 * @param currentPage O estado atual da página.
 * @param setPage Função para atualizar o estado da página.
 */
export function useEditorHistory(
  currentPage: CommunityPage | null,
  setPage: React.Dispatch<React.SetStateAction<CommunityPage | null>>
) {
  const [past, setPast] = useState<CommunityPage[]>([]);
  const [future, setFuture] = useState<CommunityPage[]>([]);
  const lastSnapshotRef = useRef<string>("");
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const HISTORY_LIMIT = 50; //

  /**
   * Salva uma versão da página no histórico 'past'.
   * @param state O estado que será arquivado (geralmente o estado antes da mudança).
   * @param immediate Se true, salva instantaneamente. Se false, aguarda o debounce de 1.5s.
   */
  const saveHistory = useCallback((state: CommunityPage, immediate = true) => {
    const stateString = JSON.stringify(state);
    
    // Evita duplicatas no histórico
    if (stateString === lastSnapshotRef.current) return;

    const performSave = () => {
      setPast(prev => [
        ...prev.slice(-(HISTORY_LIMIT - 1)), 
        JSON.parse(lastSnapshotRef.current || stateString)
      ]);
      setFuture([]); // Limpa o futuro ao realizar uma nova ação
      lastSnapshotRef.current = stateString;
    };

    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);

    if (immediate) {
      performSave();
    } else {
      // Agrupa mudanças rápidas (como digitação) para não poluir o histórico
      snapshotTimerRef.current = setTimeout(performSave, 1500);
    }
  }, []);

  /**
   * Retorna ao estado anterior.
   */
  const undo = useCallback(() => {
    if (past.length === 0 || !currentPage) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture(f => [currentPage, ...f].slice(0, HISTORY_LIMIT));
    setPage(previous);
    setPast(newPast);
    lastSnapshotRef.current = JSON.stringify(previous);
  }, [currentPage, past, setPage]);

  /**
   * Avança para um estado que foi desfeito.
   */
  const redo = useCallback(() => {
    if (future.length === 0 || !currentPage) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast(p => [...p, currentPage].slice(-(HISTORY_LIMIT - 1)));
    setPage(next);
    setFuture(newFuture);
    lastSnapshotRef.current = JSON.stringify(next);
  }, [currentPage, future, setPage]);

  /**
   * Atalhos de teclado globais para Undo (Ctrl+Z) e Redo (Ctrl+Y ou Ctrl+Shift+Z).
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isMod && !e.shiftKey && key === 'z') {
        e.preventDefault();
        undo();
      } else if (isMod && (key === 'y' || (e.shiftKey && key === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    saveHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0
  };
}