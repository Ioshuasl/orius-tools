import { useEffect, useState, type DragEvent } from 'react';
import {
  FileText, FileSpreadsheet, Search, RefreshCcw,
  AlertCircle, Activity, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { StatsCard } from '../components/StatsCard';
import { HeaderTable } from '../components/HeaderTable';
import { RecordsList } from '../components/RecordsList';
import { compararGuiasService } from '../services/api';
import type { ApiResponse } from '../types';

export default function ComparadorGuias() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [dragActivePdf, setDragActivePdf] = useState(false);
  const [dragActiveCsv, setDragActiveCsv] = useState(false);

  const handleDrag = (e: DragEvent<HTMLDivElement>, type: 'pdf' | 'csv', isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    type === 'pdf' ? setDragActivePdf(isActive) : setDragActiveCsv(isActive);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, type: 'pdf' | 'csv') => {
    e.preventDefault();
    e.stopPropagation();
    type === 'pdf' ? setDragActivePdf(false) : setDragActiveCsv(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0], type);
    }
  };

  const validateAndSetFile = (file: File, type: 'pdf' | 'csv') => {
    const isValidPdf = type === 'pdf' && file.type === 'application/pdf';
    const isValidCsv = type === 'csv' && (file.type.includes('csv') || file.name.endsWith('.csv'));

    if (!isValidPdf && type === 'pdf') {
      return toast.error("Por favor, selecione um arquivo PDF válido para a Guia do Tribunal.");
    }
    if (!isValidCsv && type === 'csv') {
      return toast.error("Por favor, selecione um arquivo CSV válido para o Relatório do Sistema.");
    }

    type === 'pdf' ? setPdfFile(file) : setCsvFile(file);
  };

  const handleCompare = async () => {
    if (!pdfFile || !csvFile) {
      toast.warning("Selecione os dois arquivos antes de comparar.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Analisando os arquivos... Isso pode levar alguns segundos.");

    try {
      const data = await compararGuiasService(pdfFile, csvFile);
      setResult(data);
      toast.success("Auditoria concluída com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Falha ao processar arquivos. Verifique se os formatos e estruturas estão corretos.",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setPdfFile(null);
    setCsvFile(null);
  };

  useEffect(() => {
    const pathAtual = window.location.pathname;
    const salvos = localStorage.getItem('orius_recent_modules');
    let lista: string[] = salvos ? JSON.parse(salvos) : [];

    // Remove se já existir (para evitar duplicatas) e adiciona no início
    lista = [pathAtual, ...lista.filter(p => p !== pathAtual)].slice(0, 5); // Mantém os 5 últimos

    localStorage.setItem('orius_recent_modules', JSON.stringify(lista));
  }, []);

  // --- Tela de Resultados ---
  if (result && result.data) {
    const { estatisticas, resumo_comparativo, analise_registros, arquivos_processados } = result.data;

    return (
      <div className="pb-20 animate-in fade-in duration-500">
        {/* Barra de Ações Fixa da Ferramenta */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg shadow-inner">
              <Activity className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Auditoria Concluída</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {/* Correção do Erro: Acesso via result.data e Optional Chaining */}
                {arquivos_processados?.pdf || pdfFile?.name} • {arquivos_processados?.csv || csvFile?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <RefreshCcw size={16} /> Nova Análise
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Analisados" value={estatisticas.total_atos_sistema} icon={Search} />
            <StatsCard title="Corretos" value={estatisticas.total_correto} icon={CheckCircle2} variant="default" />
            <StatsCard title="Divergentes" value={estatisticas.total_com_divergencia} icon={AlertCircle} variant={estatisticas.total_com_divergencia > 0 ? "warning" : "default"} />
            <StatsCard title="Ausentes" value={result.data.estatisticas.total_atos_sistema - result.data.estatisticas.total_correto - result.data.estatisticas.total_com_divergencia} icon={XCircle} variant="danger" />
          </section>

          <HeaderTable data={resumo_comparativo} />
          <RecordsList registros={analise_registros} />
        </div>
      </div>
    );
  }

  // --- Tela de Upload (Restaurada para original) ---
  return (
    <div className="flex flex-col flex-1 h-full min-h-[85vh] items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-full mb-1">
            <Activity size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Comparador de Guias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Compare o PDF do Tribunal com o CSV do sistema para identificar divergências.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

            {/* Dropzone PDF */}
            <div
              onDragEnter={(e) => handleDrag(e, 'pdf', true)}
              onDragLeave={(e) => handleDrag(e, 'pdf', false)}
              onDragOver={(e) => handleDrag(e, 'pdf', true)}
              onDrop={(e) => handleDrop(e, 'pdf')}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all ${dragActivePdf
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                  : pdfFile
                    ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-500/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <input type="file" accept=".pdf" onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0], 'pdf')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className={`p-2.5 rounded-full mb-2 shadow-sm transition-colors ${pdfFile ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                <FileText size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs">Guia Sistema (PDF)</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center mt-1 px-2">
                {pdfFile ? pdfFile.name : 'Arraste ou clique'}
              </p>
            </div>

            {/* Dropzone CSV */}
            <div
              onDragEnter={(e) => handleDrag(e, 'csv', true)}
              onDragLeave={(e) => handleDrag(e, 'csv', false)}
              onDragOver={(e) => handleDrag(e, 'csv', true)}
              onDrop={(e) => handleDrop(e, 'csv')}
              className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all ${dragActiveCsv
                  ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                  : csvFile
                    ? 'border-green-400 bg-green-50/50 dark:bg-green-500/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <input type="file" accept=".csv" onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0], 'csv')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className={`p-2.5 rounded-full mb-2 shadow-sm transition-colors ${csvFile ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-xs">Guia SEE (CSV)</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center mt-1 px-2">
                {csvFile ? csvFile.name : 'Arraste ou clique'}
              </p>
            </div>

          </div>

          <button
            onClick={handleCompare}
            disabled={loading || !pdfFile || !csvFile}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${loading
                ? 'bg-orange-400 text-white cursor-wait'
                : !pdfFile || !csvFile
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md'
              }`}
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Search size={18} />}
            {loading ? 'Analisando...' : 'Iniciar Comparação'}
          </button>
        </div>
      </div>
    </div>
  );
}