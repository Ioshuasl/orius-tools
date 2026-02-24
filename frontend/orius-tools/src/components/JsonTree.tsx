import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Book, Scale, FileText, Hash } from 'lucide-react'; // Instale lucide-react se possível
import type { NormasData, Parte, Livro, Titulo, Capitulo, Artigo } from '../types';

// Componente para itens colapsáveis
const CollapsibleSection = ({ title, icon: Icon, children, badge }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-100' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isOpen ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`font-semibold text-sm ${isOpen ? 'text-blue-900' : 'text-slate-700'}`}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">{badge}</span>}
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      {isOpen && <div className="p-4 bg-white space-y-2">{children}</div>}
    </div>
  );
};

// Componente para renderizar Artigos (o nível final)
const ArtigoCard = ({ art }: { art: Artigo }) => (
  <div className="p-4 bg-slate-50 border-l-4 border-blue-400 rounded-r-md mb-3 shadow-inner">
    <div className="flex items-center gap-2 mb-2">
      <Hash className="w-4 h-4 text-blue-500" />
      <span className="font-bold text-blue-800">Artigo {art.numero}</span>
    </div>
    <p className="text-sm text-slate-700 leading-relaxed mb-3">{art.texto}</p>
    
    {art.paragrafos?.map((p, idx) => (
      <div key={idx} className="ml-4 pl-4 border-l border-slate-300 py-1 italic text-sm text-slate-600 mb-2">
        <span className="font-semibold text-slate-800">{p.id}</span> {p.texto}
      </div>
    ))}
    
    {art.incisos?.map((i, idx) => (
      <div key={idx} className="ml-6 flex gap-2 text-sm text-slate-600 mb-1">
        <span className="font-bold text-slate-400">{i.id} -</span>
        <span>{i.texto}</span>
      </div>
    ))}
  </div>
);

export const JsonTree: React.FC<{ data: NormasData }> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.partes.map((parte, pIdx) => (
        <div key={pIdx} className="mb-6">
          <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <Scale className="text-blue-600" /> {parte.nome}
          </h2>
          
          {/* Renderiza Livros */}
          {parte.livros?.map((livro, lIdx) => (
            <CollapsibleSection key={lIdx} title={`LIVRO ${livro.id}: ${livro.nome}`} icon={Book} badge="Livro">
              {livro.titulos?.map((titulo, tIdx) => (
                <CollapsibleSection key={tIdx} title={`TÍTULO ${titulo.id}: ${titulo.nome}`} icon={FileText} badge="Título">
                  {titulo.capitulos?.map((cap, cIdx) => (
                    <CollapsibleSection key={cIdx} title={`CAPÍTULO ${cap.id}: ${cap.nome}`} icon={Hash} badge="Capítulo">
                      {cap.artigos.map((art, aIdx) => (
                        <ArtigoCard key={aIdx} art={art} />
                      ))}
                    </CollapsibleSection>
                  ))}
                  {/* Artigos diretos no Título (se houver) */}
                  {titulo.artigos?.map((art, aIdx) => <ArtigoCard key={aIdx} art={art} />)}
                </CollapsibleSection>
              ))}
            </CollapsibleSection>
          ))}
        </div>
      ))}
    </div>
  );
};