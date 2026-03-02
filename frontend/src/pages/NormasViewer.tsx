import React, { useState, useMemo } from 'react';
import { 
  Book, 
  Scale, 
  FileText, 
  Search, 
  X, 
  Layers,
  BookOpen,
} from 'lucide-react';
import type { Artigo, NormasData, SearchResult } from '../types';

import { CollapsibleSection } from '../components/Normas/CollapsibleSection';
import { ArtigoCard } from '../components/Normas/ArtigoCard';

// --- Importação de Assets ---
import normasJson from '../assets/codigo_normas.json';

const data = normasJson as NormasData;

const NormasViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // --- Lógica de Busca Inteligente ---
  const searchResults = useMemo(() => {
    if (searchTerm.trim().length < 2) return [];
    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    data.partes.forEach(parte => {
      const pName = parte.nome;
      const searchArticles = (artigos: Artigo[] | undefined, path: string) => {
        artigos?.forEach(art => {
          if (art.numero.toLowerCase().includes(term) || art.texto.toLowerCase().includes(term)) {
            results.push({ artigo: art, path });
          }
        });
      };

      parte.livros?.forEach(l => {
        const lPath = `${pName} > LIVRO ${l.id}`;
        l.titulos.forEach(t => {
          const tPath = `${lPath} > TÍTULO ${t.id}`;
          searchArticles(t.artigos, tPath);
          t.capitulos?.forEach(c => searchArticles(c.artigos, `${tPath} > CAPÍTULO ${c.id}`));
        });
      });

      parte.titulos?.forEach(t => {
        const tPath = `${pName} > TÍTULO ${t.id}`;
        searchArticles(t.artigos, tPath);
        t.capitulos?.forEach(c => searchArticles(c.artigos, `${tPath} > CAPÍTULO ${c.id}`));
      });
    });
    return results;
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <Scale size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none dark:text-white">CÓDIGO DE NORMAS</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Extrajudicial - TJGO</p>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="relative w-full md:w-1/2">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-12 pr-10 py-3.5 bg-gray-100 dark:bg-gray-800/50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-500 transition-all dark:text-white"
              placeholder="PESQUISAR ARTIGO OU TERMO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-20">
        {searchTerm.trim().length >= 2 ? (
          /* Visualização de Resultados de Busca */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encontrados: {searchResults.length}</h3>
              <button onClick={() => setSearchTerm('')} className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1 hover:underline">
                <X size={12} /> Limpar busca
              </button>
            </div>
            {searchResults.map((res, idx) => (
              <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="text-[9px] font-black text-orange-500/70 mb-1 px-1 flex items-center gap-1 uppercase tracking-tighter">
                  <BookOpen size={10} /> {res.path}
                </div>
                <ArtigoCard art={res.artigo} />
              </div>
            ))}
          </div>
        ) : (
          /* Visualização da Estrutura (JSON) */
          <div className="space-y-4">
            {data.partes.map((p, idx) => (
              <div key={idx} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500">
                    <Layers size={20} />
                  </div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{p.nome}</h2>
                </div>
                
                <div className="space-y-2">
                  {p.livros?.map((l, lIdx) => (
                    <CollapsibleSection key={lIdx} title={`LIVRO ${l.id}: ${l.nome}`} icon={Book} badge="Livro">
                      {l.titulos.map((t, tIdx) => (
                        <CollapsibleSection key={tIdx} title={`TÍTULO ${t.id}: ${t.nome}`} icon={Layers} badge="Título">
                          {t.capitulos?.map((c, cIdx) => (
                            <CollapsibleSection key={cIdx} title={`CAPÍTULO ${c.id}: ${c.nome}`} icon={FileText} badge="Capítulo">
                              {c.artigos.map((a, aIdx) => <ArtigoCard key={aIdx} art={a} />)}
                            </CollapsibleSection>
                          ))}
                          {t.artigos?.map((a, aIdx) => <ArtigoCard key={aIdx} art={a} />)}
                        </CollapsibleSection>
                      ))}
                    </CollapsibleSection>
                  ))}
                  
                  {p.titulos?.map((t, tIdx) => (
                    <CollapsibleSection key={tIdx} title={`TÍTULO ${t.id}: ${t.nome}`} icon={Layers} badge="Título">
                      {t.capitulos?.map((c, cIdx) => (
                        <CollapsibleSection key={cIdx} title={`CAPÍTULO ${c.id}: ${c.nome}`} icon={FileText} badge="Capítulo">
                          {c.artigos.map((a, aIdx) => <ArtigoCard key={aIdx} art={a} />)}
                        </CollapsibleSection>
                      ))}
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NormasViewer;