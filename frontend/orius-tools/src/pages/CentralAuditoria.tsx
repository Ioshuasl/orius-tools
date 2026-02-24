import { useState } from 'react';
import { ShieldCheck, FileText, Users, FileJson, ArrowRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mapeamento dos módulos existentes no seu projeto
const modulos = [
  {
    title: 'CEP',
    desc: 'Escrituras e Procurações (CENSEC)',
    path: '/auditoria/cep',
    icon: ShieldCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    tags: ['censec', 'escritura', 'procuração']
  },
  {
    title: 'CESDI',
    desc: 'Separações, Divórcios e Inventários',
    path: '/auditoria/cesdi',
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    tags: ['divorcio', 'inventario', 'separação', 'censec']
  },
  {
    title: 'RCTO',
    desc: 'Registro Central de Testamentos Online',
    path: '/auditoria/rcto',
    icon: FileText,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    tags: ['testamento', 'rcto', 'censec']
  },
  {
    title: 'DOI',
    desc: 'Declaração sobre Operações Imobiliárias',
    path: '/auditoria/doi',
    icon: FileJson,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    tags: ['receita federal', 'imovel', 'imobiliaria', 'lote']
  }
];

export default function CentralAuditoria() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtragem: busca no título, descrição e tags
  const modulosFiltrados = modulos.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10 text-center space-y-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Central de Auditoria</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Escolha o serviço de higienização de arquivos</p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="max-w-md mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar módulo (ex: testamento, censec...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-11 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium dark:text-white"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Resultados */}
      {modulosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modulosFiltrados.map((m) => (
            <button
              key={m.path}
              onClick={() => navigate(m.path)}
              className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left flex flex-col h-full"
            >
              <div className={`p-3 rounded-2xl inline-block mb-4 ${m.bg} ${m.color}`}>
                <m.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{m.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">{m.desc}</p>
              <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-orange-500 group-hover:gap-2 transition-all">
                Abrir Módulo <ArrowRight size={14} className="ml-1" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum módulo encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Tente pesquisar por outros termos.</p>
        </div>
      )}
    </div>
  );
}