import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronRight, 
  ChevronDown, 
  Book, 
  Scale, 
  FileText, 
  Search, 
  X, 
  Layers,
  BookOpen,
  Hash,
  ArrowLeft
} from 'lucide-react';

// --- Interfaces de Tipagem ---
interface Paragrafo {
  id: string;
  texto: string;
}

interface Inciso {
  id: string;
  texto: string;
}

interface Artigo {
  numero: string;
  texto: string;
  paragrafos?: Paragrafo[];
  incisos?: Inciso[];
}

interface Capitulo {
  id: string;
  nome: string;
  artigos: Artigo[];
}

interface Titulo {
  id: string;
  nome: string;
  capitulos?: Capitulo[];
  artigos?: Artigo[];
}

interface Livro {
  id: string;
  nome: string;
  titulos: Titulo[];
}

interface Parte {
  nome: string;
  livros?: Livro[];
  titulos?: Titulo[];
}

interface NormasData {
  partes: Parte[];
}

interface SearchResult {
  artigo: Artigo;
  path: string;
}

// --- Importação de Assets ---
import normasJson from '../assets/codigo_normas.json';
// @ts-ignore
import normasMd from '../assets/codigo_normas.md?raw';

const data = normasJson as NormasData;

// --- Sub-componentes Estilizados ---

const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: string;
}> = ({ title, icon: Icon, children, badge }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`mb-3 border rounded-[1.5rem] overflow-hidden transition-all ${
      isOpen 
        ? 'border-orange-200 dark:border-orange-900/30 bg-white dark:bg-gray-800 shadow-sm' 
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-left ${
          isOpen ? 'bg-orange-50/50 dark:bg-orange-900/10 border-b border-gray-100 dark:border-gray-700' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-orange-500 text-white' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'}`}>
            <Icon size={18} />
          </div>
          <span className={`font-bold text-sm leading-tight ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="hidden sm:inline-block bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-[10px] px-2 py-0.5 rounded-lg uppercase font-black tracking-widest">
              {badge}
            </span>
          )}
          {isOpen ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

const ArtigoCard: React.FC<{ art: Artigo }> = ({ art }) => (
  <div className="p-5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 border-l-4 border-l-orange-500 rounded-r-2xl mb-4 transition-all hover:shadow-md">
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-orange-100 dark:bg-orange-900/20 p-1.5 rounded-lg text-orange-600 dark:text-orange-400">
        <Hash size={14} />
      </div>
      <span className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-widest">Artigo {art.numero}</span>
    </div>
    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-semibold mb-4">{art.texto}</p>
    
    <div className="space-y-3">
      {art.paragrafos?.map((p, idx) => (
        <div key={idx} className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 py-1 text-sm text-gray-500 dark:text-gray-400 italic">
          <span className="font-black text-gray-800 dark:text-gray-200 not-italic mr-1">{p.id}</span> {p.texto}
        </div>
      ))}
      {art.incisos?.map((i, idx) => (
        <div key={idx} className="ml-4 flex gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-black text-orange-500 min-w-[20px]">{i.id} -</span> {i.texto}
        </div>
      ))}
    </div>
  </div>
);

const NormasViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'json' | 'md'>('json');
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

          {/* Barra de Busca Estilo Dashboard */}
          <div className="relative w-full md:w-1/3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800/50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-orange-500 transition-all dark:text-white"
              placeholder="PESQUISAR ARTIGO OU TERMO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setViewMode('json')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${viewMode === 'json' ? 'bg-white dark:bg-gray-700 text-orange-500 dark:text-white shadow-sm' : 'text-gray-400'}`}
            >
              ESTRUTURA
            </button>
            <button 
              onClick={() => setViewMode('md')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${viewMode === 'md' ? 'bg-white dark:bg-gray-700 text-orange-500 dark:text-white shadow-sm' : 'text-gray-400'}`}
            >
              LEITURA
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-8 pb-20">
        {searchTerm.trim().length >= 2 ? (
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
          viewMode === 'json' ? (
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
          ) : (
            <div className="bg-white dark:bg-gray-900 p-8 md:p-16 rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-gray-800">
              <article className="prose prose-slate dark:prose-invert prose-orange max-w-none 
                prose-headings:font-black prose-headings:tracking-tight
                prose-strong:text-orange-600 dark:prose-strong:text-orange-400
                prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:border-l-orange-500 prose-blockquote:rounded-r-xl">
                <ReactMarkdown>{normasMd as string}</ReactMarkdown>
              </article>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default NormasViewer;