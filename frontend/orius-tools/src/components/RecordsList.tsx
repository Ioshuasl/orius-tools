import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Check, Filter, Search, Copy, CheckCircle2 } from 'lucide-react';
import type { RegistroAuditoria } from '../types';
import { formatCurrency } from '../lib/utils';

interface RecordsListProps {
  registros: RegistroAuditoria[];
}

export function RecordsList({ registros }: RecordsListProps) {
  const [showOnlyErrors, setShowOnlyErrors] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return registros.filter(reg => {
      const matchStatus = showOnlyErrors ? reg.status_registro !== 'OK' : true;
      const matchSearch = searchTerm === '' || 
        reg.pedido.includes(searchTerm) || 
        reg.codigo.toString().includes(searchTerm) || 
        reg.tipo_ato.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchStatus && matchSearch;
    });
  }, [registros, showOnlyErrors, searchTerm]);

  const formatarValor = (campo: string, valor: number | null) => {
    if (valor === null) return '-';
    if (campo.includes('Quantidade')) return valor;
    return formatCurrency(valor);
  };

  const handleCopy = (e: React.MouseEvent, texto: string) => {
    e.stopPropagation(); 
    navigator.clipboard.writeText(texto);
    setCopiedId(texto);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      
      {/* Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">Detalhamento por Ato</h2>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar pedido, cód..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              showOnlyErrors 
                ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">{showOnlyErrors ? 'Apenas Divergências' : 'Mostrar Todos'}</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3 mt-4">
        {filteredData.map((reg) => {
            const uniqueKey = `${reg.pedido}-${reg.codigo}`;
            const isExpanded = expandedId === uniqueKey;
            const hasError = reg.status_registro !== 'OK';

            return (
              <div key={uniqueKey} className={`bg-white dark:bg-gray-800 rounded-xl border transition-all border-gray-300 dark:hover:border-gray-600 ${
                  hasError ? 'border-l-4 border-l-red-500 dark:border-l-red-500 border-gray-200 dark:border-gray-700 shadow-sm' : 'border-l-4 border-l-green-400 dark:border-l-green-500 border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Cabeçalho do Acordeão */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : uniqueKey)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-r-xl"
                >
                  <div className="flex items-start md:items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full shrink-0 mt-1 md:mt-0 ${hasError ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                      {hasError ? <AlertCircle size={18} /> : <Check size={18} />}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          Cód: {reg.codigo}
                        </span>
                        <div className="flex items-center gap-1 group/copy">
                          <span>PEDIDO: {reg.pedido}</span>
                          <button 
                            onClick={(e) => handleCopy(e, reg.pedido)}
                            title="Copiar Pedido"
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            {copiedId === reg.pedido ? <CheckCircle2 size={12} className="text-green-600 dark:text-green-400"/> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base leading-snug pr-4">
                        {reg.tipo_ato}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-4 md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 border-gray-100 dark:border-gray-700">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      hasError ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                    }`}>
                      {reg.status_registro.replace(/_/g, ' ')}
                    </span>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500 shrink-0"/> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500 shrink-0"/>}
                  </div>
                </div>

                {/* Grid Interno (Expandido) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 p-5 rounded-b-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reg.detalhes
                          ?.filter(detalhe => detalhe.campo !== 'Código Ato')
                          .map((detalhe, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border text-sm bg-white dark:bg-gray-800 ${
                              detalhe.status === 'DIVERGENTE' ? 'border-red-200 dark:border-red-500/30 shadow-sm ring-1 ring-red-50 dark:ring-red-500/10' : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                              {detalhe.campo}
                            </span>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">Sistema:</span>
                                <strong className="text-gray-700 dark:text-gray-200">{formatarValor(detalhe.campo, detalhe.valor_sistema)}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">Arquivo:</span>
                                <strong className="text-gray-700 dark:text-gray-200">{formatarValor(detalhe.campo, detalhe.valor_arquivo)}</strong>
                              </div>
                              {detalhe.status === 'DIVERGENTE' && (
                                <div className="flex justify-between pt-2 mt-1 border-t border-red-50 dark:border-red-500/20">
                                  <span className="text-red-400 text-xs font-semibold">Dif:</span>
                                  <strong className="text-red-600 dark:text-red-400 font-bold">{formatarValor(detalhe.campo, detalhe.diferenca)}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
        })}
        
        {filteredData.length === 0 && (
          <div className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500 dark:text-gray-400">Nenhum registro encontrado.</p>
            <p className="text-sm">Tente limpar a busca ou alterar o filtro de divergências.</p>
          </div>
        )}
      </div>
    </div>
  );
}