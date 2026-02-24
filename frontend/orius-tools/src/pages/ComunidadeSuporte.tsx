import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, BookOpen,
  MessageSquare, Tag, Layout, List, ChevronRight, Trash2, AlertCircle, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getPublicationsService, createPageService, deletePageService } from '../services/api';
import type { CommunityPage } from '../types';

export default function ComunidadeSuporte() {
  const navigate = useNavigate();
  const [publications, setPublications] = useState<CommunityPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('community-view-mode');
    return (saved === 'list' || saved === 'grid') ? saved : 'grid';
  });

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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg text-orange-600 dark:text-orange-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Comunidade de Suporte</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Base de conhecimento técnica Orius</p>
          </div>
        </div>
        <button onClick={handleCreateNew} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all shadow-orange-500/20">
          <Plus size={18} /> Nova Publicação
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, conteúdo ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
            />
          </div>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white min-w-[200px]"
          >
            <option value="">Todos os Sistemas</option>
            {systems.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Toolbar de Layout */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {publications.length} RESULTADOS
          </span>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
              <Layout size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
            {[1, 2, 3].map(i => <div key={i} className={`${viewMode === 'grid' ? 'h-48' : 'h-20'} bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-700`} />)}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
            {publications.map((pub) => (
              <div
                key={pub.id}
                onClick={() => navigate(`/comunidade/editor/${pub.id}`)}
                className={`group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer flex 
                  ${viewMode === 'grid' ? 'flex-col justify-between p-5 rounded-2xl' : 'flex-row items-center p-4 rounded-xl gap-4 hover:bg-orange-50/30 dark:hover:bg-orange-500/5'}`}
              >
                {/* Visualização em GRADE */}
                {viewMode === 'grid' && (
                  <>
                    <button
                      onClick={(e) => openDeleteModal(e, pub.id, pub.title)}
                      className="absolute top-3 right-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-20"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 dark:bg-orange-500/20 px-2 py-1 rounded">
                        {pub.system || 'Geral'}
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors mt-3 line-clamp-2">
                        {pub.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {pub.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[9px] text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                            <Tag size={8} /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold tracking-tighter">
                        {new Date(pub.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-500" />
                    </div>
                  </>
                )}

                {/* Visualização em LISTA (Row) */}
                {viewMode === 'list' && (
                  <>
                    <div className="hidden sm:flex bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-gray-400 group-hover:text-orange-500 transition-colors shrink-0">
                      <BookOpen size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded">
                          {pub.system || 'Geral'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(pub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors truncate text-sm">
                        {pub.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Botão de excluir sempre visível na lista para evitar confusão */}
                      <button
                        onClick={(e) => openDeleteModal(e, pub.id, pub.title)}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 mx-1" />
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600">
                  <AlertCircle size={24} />
                </div>
                <button onClick={() => setIsDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remover Publicação?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Deseja excluir permanentemente <span className="font-bold text-gray-700 dark:text-gray-200">"{pageToDelete?.title}"</span>?
                Esta ação também removerá todas as subpáginas associadas.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}