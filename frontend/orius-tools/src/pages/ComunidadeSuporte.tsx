import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, BookOpen, 
  MessageSquare, Tag, Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { getPublicationsService, createPageService } from '../services/api';
import type { CommunityPage } from '../types';

export default function ComunidadeSuporte() {
  const navigate = useNavigate();
  const [publications, setPublications] = useState<CommunityPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');

  const systems = [
    'TABELIONATO DE NOTAS', 'PROTESTO DE TÍTULOS', 'REGISTRO CIVIL', 
    'REGISTRO DE IMÓVEIS', 'REGISTRO DE TÍTULOS E DOCUMENTO', 'CAIXA', 'NOTA FISCAL'
  ];

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const response = await getPublicationsService({ 
        search: searchTerm, 
        system: selectedSystem 
      });
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
      const response = await createPageService({ 
        title: "Nova Publicação",
        content: []
      });
      const newPage = response.data as CommunityPage;
      toast.success("Publicação iniciada!");
      navigate(`/comunidade/editor/${newPage.id}`);
    } catch (error) {
      toast.error("Erro ao criar nova publicação.");
    }
  };

  return (
    <div className="pb-12 animate-in fade-in duration-300">
      {/* Header Compacto */}
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
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
        >
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
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
            />
          </div>
          <select 
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
          >
            <option value="">Todos os Sistemas</option>
            {systems.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Grid de Publicações */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <div 
                key={pub.id}
                onClick={() => navigate(`/comunidade/editor/${pub.id}`)}
                className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded">
                      {pub.system || 'Geral'}
                    </span>
                    <Layout size={14} className="text-gray-300 group-hover:text-orange-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                    {pub.title}
                  </h3>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex gap-1">
                    {pub.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[9px] text-gray-400 flex items-center gap-1"><Tag size={8}/> {tag}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(pub.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && publications.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">Nenhuma publicação encontrada</h3>
          </div>
        )}
      </div>
    </div>
  );
}