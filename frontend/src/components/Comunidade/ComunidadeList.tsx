import { useNavigate } from 'react-router-dom';
import { Tag, ChevronRight, Trash2, BookOpen } from 'lucide-react';
import type { CommunityPage } from '../../types';

interface ComunidadeListProps {
  publications: CommunityPage[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onDeleteClick: (e: React.MouseEvent, id: string, title: string) => void;
}

export function ComunidadeList({ publications, loading, viewMode, onDeleteClick }: ComunidadeListProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
        {[1, 2, 3].map(i => (
          <div key={i} className={`${viewMode === 'grid' ? 'h-48' : 'h-20'} bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-700`} />
        ))}
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-3"}>
      {publications.map((pub) => (
        <div
          key={pub.id}
          onClick={() => navigate(`/comunidade/editor/${pub.id}`)}
          className={`group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer flex 
            ${viewMode === 'grid' ? 'flex-col justify-between p-5 rounded-2xl' : 'flex-row items-center p-4 rounded-xl gap-4 hover:bg-orange-50/30 dark:hover:bg-orange-500/5'}`}
        >
          {viewMode === 'grid' ? (
            <>
              <button
                onClick={(e) => onDeleteClick(e, pub.id, pub.title)}
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
          ) : (
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
                <button
                  onClick={(e) => onDeleteClick(e, pub.id, pub.title)}
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
  );
}