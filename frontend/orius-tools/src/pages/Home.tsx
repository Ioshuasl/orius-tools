import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  ShieldCheck, 
  FileSearch, 
  History, 
  Zap,
  Clock,
  Users,
  MessagesSquare,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

// Mapeamento atualizado incluindo a Tabela de Emolumentos
const MODULOS_INFO: Record<string, any> = {
  '/auditoria/cep': { title: 'CEP', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  '/auditoria/cesdi': { title: 'CESDI', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  '/auditoria/rcto': { title: 'RCTO', icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  '/auditoria/doi': { title: 'DOI', icon: FileJson, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  '/comparador-guias': { title: 'Comparador', icon: FileSearch, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  '/tabela-emolumentos': { title: 'Emolumentos', icon: FileSpreadsheet, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  '/comunidade': { title: 'Comunidade', icon: MessagesSquare, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
};

export default function Home() {
  const navigate = useNavigate();
  const [recentes, setRecentes] = useState<string[]>([]);

  useEffect(() => {
    const history = localStorage.getItem('orius_recent_modules');
    if (history) {
      setRecentes(JSON.parse(history));
    }
  }, []);

  const atalhosRapidos = [
    { label: 'CEP', path: '/auditoria/cep', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'CESDI', path: '/auditoria/cesdi', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'DOI', path: '/auditoria/doi', icon: FileJson, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Comparador', path: '/comparador-guias', icon: FileSearch, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Comunidade', path: '/comunidade', icon: MessagesSquare, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-500/10' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Olá, <span className="text-orange-500">Ioshua</span>! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Seu canivete suíço para auditorias e rotinas notariais.
          </p>
        </div>
        <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Sistema Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-orange-500" />
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Ações Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {atalhosRapidos.map((atalho) => (
              <button 
                key={atalho.path}
                onClick={() => navigate(atalho.path)}
                className="flex flex-col items-center justify-center p-5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm hover:shadow-xl hover:scale-105 transition-all group"
              >
                <div className={`p-3 rounded-2xl mb-3 ${atalho.bg} ${atalho.color} group-hover:scale-110 transition-transform`}>
                  <atalho.icon size={24} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{atalho.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-gray-400" />
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Acessos Recentes</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-2 shadow-sm">
            {recentes.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recentes.map((path) => {
                  const info = MODULOS_INFO[path];
                  if (!info) return null;
                  return (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors first:rounded-t-[1.5rem] last:rounded-b-[1.5rem]"
                    >
                      <div className={`p-2 rounded-xl ${info.bg} ${info.color}`}>
                        <info.icon size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{info.title}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Acessar agora</div>
                      </div>
                      <History size={14} className="text-gray-300" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center space-y-2">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Activity size={20} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}