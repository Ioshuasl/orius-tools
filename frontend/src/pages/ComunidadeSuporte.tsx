import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPublicationsService, createPageService, deletePageService } from '../services/api';
import type { CommunityPage } from '../types';

// Componentes Refatorados
import { ComunidadeHeader } from '../components/Comunidade/ComunidadeHeader';
import { ComunidadeSearch } from '../components/Comunidade/ComunidadeSearch';
import { ComunidadeList } from '../components/Comunidade/ComunidadeList';
import { ConfirmationModal } from '../components/ConfirmationModal';

export default function ComunidadeSuporte() {
  const navigate = useNavigate();
  const [publications, setPublications] = useState<CommunityPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('community-view-mode');
    return (saved === 'list' || saved === 'grid') ? saved : 'grid';
  });

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const systems = [
    'TABELIONATO DE NOTAS', 'PROTESTO DE TÍTULOS', 'REGISTRO CIVIL',
    'REGISTRO DE IMÓVEIS', 'REGISTRO DE TÍTULOS E DOCUMENTO', 'CAIXA', 'NOTA FISCAL'
  ];

  useEffect(() => {
    localStorage.setItem('community-view-mode', viewMode);
  }, [viewMode]);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const response = await getPublicationsService({ search: searchTerm, system: selectedSystem });
      setPublications(response.data as CommunityPage[]);
    } catch (error) {
      toast.error("Erro ao carregar comunidade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchPublications(), 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedSystem]);

  const handleCreateNew = async () => {
    try {
      const response = await createPageService({ title: "Nova Publicação", content: [] });
      const newPage = response.data as CommunityPage;
      toast.success("Publicação iniciada!");
      navigate(`/comunidade/editor/${newPage.id}`);
    } catch (error) {
      toast.error("Erro ao criar nova publicação.");
    }
  };

  const openDeleteModal = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    setPageToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return;
    setIsDeleting(true);
    try {
      await deletePageService(pageToDelete.id);
      toast.success("Publicação removida.");
      setPublications(prev => prev.filter(p => p.id !== pageToDelete.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Erro ao remover.");
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  };

  return (
    <div className="pb-12 animate-in fade-in duration-300">
      <ComunidadeHeader onCreateNew={handleCreateNew} />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ComunidadeSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedSystem={selectedSystem}
          onSystemChange={setSelectedSystem}
          systems={systems}
          resultsCount={publications.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <ComunidadeList 
          publications={publications}
          loading={loading}
          viewMode={viewMode}
          onDeleteClick={openDeleteModal}
        />
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Remover Publicação?"
        description={
          <>
            Deseja excluir permanentemente <span className="font-bold text-gray-700 dark:text-gray-200">"{pageToDelete?.title}"</span>?
            Esta ação também removerá todas as subpáginas associadas.
          </>
        }
        confirmText="Confirmar Exclusão"
      />
    </div>
  );
}