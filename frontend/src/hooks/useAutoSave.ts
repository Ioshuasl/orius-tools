import { useState, useEffect, useCallback, useRef } from 'react';
import { updatePage } from '../services/api';
import type { CommunityPage } from '../types';

/**
 * Hook para gerenciar o salvamento automático e a prevenção de perda de dados.
 * @param page O estado atual da página.
 */
export function useAutoSave(page: CommunityPage | null) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Ref para garantir que o salvamento no unmount use a versão mais recente
  const pageRef = useRef(page);
  
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  /**
   * Função central de persistência que envia os dados para a API.
   */
  const persistData = useCallback(async (currentPage: CommunityPage) => {
    setIsSaving(true);
    try {
      await updatePage(currentPage.id, currentPage);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Erro ao salvar automaticamente:", error);
      // Mantemos hasUnsavedChanges como true para tentar novamente no próximo ciclo
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Lógica de Auto-Save (Debounce de 2.5s)
   */
  useEffect(() => {
    if (!hasUnsavedChanges || !page) return;

    const timer = setTimeout(() => {
      persistData(page);
    }, 2500);

    return () => clearTimeout(timer);
  }, [page, hasUnsavedChanges, persistData]);

  /**
   * Salvamento no Unmount (quando o componente é destruído pelo React)
   */
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && pageRef.current) {
        updatePage(pageRef.current.id, pageRef.current).catch(err => 
          console.error("Falha no salvamento ao sair do componente:", err)
        );
      }
    };
  }, [hasUnsavedChanges]);

  /**
   * Bloqueio de Saída do Navegador (previne fechar aba ou recarregar)
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Exibe o diálogo padrão do navegador
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    isSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    persistData // Exposto caso queira forçar um save manual (ex: botão Ctrl+S)
  };
}