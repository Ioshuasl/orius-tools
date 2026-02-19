import React, { useState, type DragEvent, useMemo } from 'react';
import { 
  FileSpreadsheet, Search, RefreshCcw, Activity, 
  ChevronLeft, ChevronRight, Download, Network
} from 'lucide-react';
import { toast } from 'sonner';

import { converterTabelaService } from '../services/api';
import type { ApiResponseTabela } from '../types';
import { formatCurrency } from '../lib/utils';
import { StatsCard } from '../components/StatsCard';

export default function TabelaEmolumentos() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ApiResponseTabela | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleDrag = (e: DragEvent<HTMLDivElement>, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isActive);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isExcel = file.type.includes('spreadsheetml') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      return toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls) válido.");
    }
    setFile(file);
    toast.success(`${file.name} adicionado com sucesso.`);
  };

  const handleConvert = async () => {
    if (!file) return;
    
    setLoading(true);
    const toastId = toast.loading("Extraindo e parametrizando dados...");

    try {
      const data = await converterTabelaService(file);
      setResult(data);
      toast.success("Tabela estruturada com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Falha ao processar a planilha.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Filtro
  const filteredData = useMemo(() => {
    if (!result) return [];
    setCurrentPage(1); 
    const lowerSearch = searchTerm.toLowerCase();
    
    return result.data.filter(item => 
      item.descricao_selo.toLowerCase().includes(lowerSearch) ||
      item.id_selo.toString().includes(lowerSearch) ||
      item.sistema.toLowerCase().includes(lowerSearch) ||
      (item.ato && item.ato.toLowerCase().includes(lowerSearch)) ||
      (item.condicao_pagamento && item.condicao_pagamento.toLowerCase().includes(lowerSearch)) ||
      (item.condicao_especial && item.condicao_especial.toLowerCase().includes(lowerSearch)) ||
      (item.id_selo_combinado && item.id_selo_combinado.toLowerCase().includes(lowerSearch))
    );
  }, [result, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatSeloCombinado = (texto: string) => {
    return texto.replace(/\n/g, ', ');
  };

  if (result) {
    return (
      <div className="pb-12 animate-in fade-in duration-300">
        {/* Header Compacto da Ferramenta */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-3 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-md shadow-inner">
              <FileSpreadsheet className="text-orange-600 dark:text-orange-400" size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Dados Extraídos</h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[300px]">
                {file?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "tabela_emolumentos.json";
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-100 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
            >
              <Download size={14} /> Exportar JSON
            </button>
            <button 
              onClick={() => {setResult(null); setFile(null); setSearchTerm('');}}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCcw size={14} /> Novo
            </button>
          </div>
        </div>

        {/* Container Fluido para a Tabela */}
        <div className="p-4 sm:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
          {/* KPIs Mais compactos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Registros" value={result.total_registros} icon={Activity} />
            <StatsCard title="Sistemas" value={new Set(result.data.map(i => i.sistema)).size} icon={Search} variant="default" />
            <StatsCard title="Agrupadores" value={result.data.filter(i => i.id_selo_combinado).length} icon={Network} variant="default" />
            <StatsCard title="Atos Específicos" value={result.data.filter(i => i.ato).length} icon={FileSpreadsheet} variant="default" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200 flex flex-col">
            {/* Barra de Busca da Tabela */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar código, sistema, ato..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium sticky top-0 shadow-sm z-0">
                  <tr>
                    <th className="px-4 py-2.5 w-16">Cód</th>
                    <th className="px-4 py-2.5 w-24">Agrupador</th>
                    <th className="px-4 py-2.5 min-w-[250px] xl:min-w-[350px]">Descrição do Selo</th>
                    <th className="px-4 py-2.5 min-w-[200px]">Sistema & Regras</th>
                    <th className="px-4 py-2.5 text-right w-24">Emolumentos</th>
                    <th className="px-4 py-2.5 text-right w-24">Taxa Jud.</th>
                    <th className="px-4 py-2.5 text-right w-24">Faixa Cot.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {paginatedData.map((item, index) => (
                    <tr key={index} className="hover:bg-orange-50/30 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                        {item.id_selo}
                      </td>
                      
                      <td className="px-4 py-2">
                        {item.id_selo_combinado ? (
                          <div 
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help truncate max-w-[70px]"
                            title={formatSeloCombinado(item.id_selo_combinado)}
                          >
                            {formatSeloCombinado(item.id_selo_combinado)}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>

                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 leading-snug whitespace-normal">
                        {item.descricao_selo}
                      </td>
                      
                      <td className="px-4 py-2 whitespace-normal">
                        <div className="flex flex-wrap gap-1">
                          <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-100 dark:border-orange-500/20">
                            {item.sistema}
                          </span>
                          
                          {item.ato && (
                             <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-500/20" title="Ato">
                               {item.ato}
                             </span>
                          )}
                          {item.condicao_pagamento && (
                             <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-100 dark:border-purple-500/20" title="Condição">
                               {item.condicao_pagamento.replace(/_/g, ' ')}
                             </span>
                          )}
                          {item.condicao_especial && item.condicao_especial !== 'PADRAO' && (
                             <span className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-green-100 dark:border-green-500/20">
                               {item.condicao_especial.replace(/_/g, ' ')}
                             </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.valor_emolumento)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.valor_taxa_judiciaria)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-500">
                        {item.faixa_cotacao ? formatCurrency(item.faixa_cotacao) : '-'}
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                        Nenhum registro encontrado para "{searchTerm}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação Compacta */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
                <span>Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-medium text-gray-900 dark:text-white px-2">Pág {currentPage} / {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Tela de Upload Compacta e Centralizada ---
  return (
    <div className="flex flex-col flex-1 h-full min-h-[80vh] items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-full mb-1">
             <FileSpreadsheet size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Tabela de Emolumentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Gere o JSON estruturado a partir da planilha do Tribunal.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div 
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all mb-4 ${
              dragActive 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' 
                : file 
                  ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-500/5' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              title="Selecione o arquivo Excel"
            />
            <div className={`p-3 rounded-full mb-3 shadow-sm transition-colors ${file ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {file ? 'Planilha Selecionada' : 'Buscar arquivo XLSX'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full max-w-[250px] text-center mt-1">
              {file ? file.name : 'Arraste para cá ou clique'}
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading || !file}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-orange-400 text-white cursor-wait' 
                : !file 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md'
            }`}
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <RefreshCcw size={16} />}
            {loading ? 'Processando...' : 'Converter para JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}