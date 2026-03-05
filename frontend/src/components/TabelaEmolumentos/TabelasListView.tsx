import { Plus, Calendar, History, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TabelaEmolumentosHeader } from '../../types'; //

interface TabelasListViewProps {
  tabelas: TabelaEmolumentosHeader[];
  loading: boolean;
  onSelect: (id: number) => void;
  onStartImport: () => void;
}

export function TabelasListView({ tabelas, loading, onSelect, onStartImport }: TabelasListViewProps) {
  
  // Formatação de data simples para exibição nos cards
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho da Lista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Gerenciamento de Emolumentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visualize e alterne entre as vigências cadastradas no banco de dados.
          </p>
        </div>

        <button
          onClick={onStartImport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus size={18} /> Nova Importação
        </button>
      </div>

      {/* Grid de Tabelas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
      ) : tabelas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tabelas.map((tabela) => (
            <div 
              key={tabela.id}
              onClick={() => onSelect(tabela.id)} //
              className={`group relative flex flex-col p-5 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                tabela.ativa 
                  ? 'border-orange-500/50 shadow-orange-500/5 ring-1 ring-orange-500/10' 
                  : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500/30'
              }`}
            >
              {/* Badge de Status Ativo */}
              {tabela.ativa && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black uppercase rounded shadow-sm flex items-center gap-1">
                  <CheckCircle2 size={10} /> Vigente
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${tabela.ativa ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                  <Calendar size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  ID: {tabela.id}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {tabela.nome}
              </h3>
              
              <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <History size={12} />
                  {formatDate(tabela.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={12} /> Ver registros
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          <AlertCircle size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nenhuma tabela cadastrada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Importe sua primeira planilha do Tribunal para começar.</p>
          <button
            onClick={onStartImport}
            className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            Começar Importação
          </button>
        </div>
      )}
    </div>
  );
}