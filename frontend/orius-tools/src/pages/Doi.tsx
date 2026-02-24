import { useState, useRef, useEffect } from 'react';
import {
  FileJson, Search, RefreshCcw, AlertCircle,
  Activity, Code, List,
  ExternalLink, ShieldCheck, History, Download
} from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

import { StatsCard } from '../components/StatsCard';
import { HistoryModal } from '../components/HistoryModal';
import { validarDoiService, corrigirDoiService } from '../services/api';
import type { ApiResponseCensec, InstrucaoCorrecao } from '../types';

export default function Doi() {
  const editorRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jsonCode, setJsonCode] = useState<string>("");
  const [result, setResult] = useState<ApiResponseCensec | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'code'>('table');
  const [correcoesManuais, setCorrecoesManuais] = useState<Record<number, string>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Histórico persistente isolado para auditorias da Receita Federal
  const [historicoAcumulado, setHistoricoAcumulado] = useState<Record<number, { campo: string, valor: string, localizacao: string }>>({});

  useEffect(() => {
    const salvo = localStorage.getItem('orius_doi_history');
    if (salvo) {
      setHistoricoAcumulado(JSON.parse(salvo));
    }
  }, []);

  const todosErrosRespondidos = result ?
    result.erros.every((_, idx) => correcoesManuais[idx] && correcoesManuais[idx].trim() !== "")
    : false;

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.json')) {
      return toast.error("Por favor, selecione um arquivo JSON válido conforme o manual da DOI.");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        setJsonCode(formatted);
        setFile(new File([new Blob([formatted], { type: 'application/json' })], selectedFile.name));
        setResult(null);
        setCorrecoesManuais({});
        localStorage.removeItem('orius_doi_history');
        setHistoricoAcumulado({});
      } catch (err) {
        toast.error("Erro na sintaxe JSON do arquivo original.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await validarDoiService(file);
      setResult(data);
      data.success ? toast.success("Lote DOI 100% válido!") : toast.warning(`${data.erros.length} inconsistências detectadas.`);
    } catch (err) {
      toast.error("Falha na auditoria técnica da DOI.");
    } finally { setLoading(false); }
  };

  const handleExportarOuRevalidar = async () => {
    if (!file || !result) return;

    // Mapeamento baseado no indexDecl para lotes JSON
    const instrucoes: any[] = result.erros
      .filter((_, idx) => correcoesManuais[idx])
      .map((erro, idx) => ({
        indexDecl: (erro as any).indexDecl,
        campo: (erro as any).campoRelacionado || 'valorOperacaoImobiliaria',
        novoValor: correcoesManuais[idx]
      }));

    const novoHistorico = { ...historicoAcumulado };
    result.erros.forEach((erro, idx) => {
      if (correcoesManuais[idx]) {
        novoHistorico[idx] = {
          campo: (erro as any).campoRelacionado || 'Campo',
          valor: correcoesManuais[idx],
          localizacao: erro.localizacao
        };
      }
    });

    setHistoricoAcumulado(novoHistorico);
    localStorage.setItem('orius_doi_history', JSON.stringify(novoHistorico));

    setLoading(true);
    try {
      const response = await corrigirDoiService(file, instrucoes as any);

      if (response.success || response.errorCount === 0) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DOI_CORRIGIDA_${file.name}`;
        a.click();

        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        toast.success("Lote DOI Higienizado e Exportado!");
        localStorage.removeItem('orius_doi_history');

        setResult({
          success: true,
          total_atos_agrupados: result.total_atos_agrupados,
          total_erros: 0,
          erros: []
        });
      } else {
        toast.error(`Restam ${response.errorCount} erros no lote.`);
        const novoArquivo = new File([response.data], file.name, { type: 'application/json' });
        setFile(novoArquivo);

        const reader = new FileReader();
        reader.onload = (e) => setJsonCode(e.target?.result as string);
        reader.readAsText(novoArquivo);

        const data = await validarDoiService(novoArquivo);
        setResult(data);
        setCorrecoesManuais({});
      }
    } catch (err) {
      toast.error("Erro no processamento das correções DOI.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLine = (index: number) => {
    setViewMode('code');
    // Para JSON, a busca é textual, então focamos no início do arquivo
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(1);
        editorRef.current.focus();
      }
    }, 150);
  };

  // Adicione isso no useEffect inicial de cada página de módulo
  useEffect(() => {
    const pathAtual = window.location.pathname;
    const salvos = localStorage.getItem('orius_recent_modules');
    let lista: string[] = salvos ? JSON.parse(salvos) : [];

    // Remove se já existir (para evitar duplicatas) e adiciona no início
    lista = [pathAtual, ...lista.filter(p => p !== pathAtual)].slice(0, 5); // Mantém os 5 últimos

    localStorage.setItem('orius_recent_modules', JSON.stringify(lista));
  }, []);

  if (result) {
    return (
      <div className="pb-20 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between transition-colors text-gray-900 dark:text-white">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><List size={14} className="inline mr-1" /> Auditoria</button>
            <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><Code size={14} className="inline mr-1" /> JSON</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setResult(null); setFile(null); localStorage.removeItem('orius_doi_history'); }} className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Voltar</button>

            {!result.success && (
              <>
                <button onClick={() => setShowHistoryModal(true)} className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-2">
                  <History size={14} /> Histórico
                </button>
                <button onClick={handleExportarOuRevalidar} disabled={loading || !todosErrosRespondidos} className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${!todosErrosRespondidos ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                  {loading ? <RefreshCcw className="animate-spin" size={14} /> : <Download size={14} />}
                  {todosErrosRespondidos ? 'Exportar Corrigido' : 'Conclua os Ajustes'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Declarações no Lote" value={result.total_atos_agrupados} icon={FileJson} />
            <StatsCard title="Pendências" value={result.total_erros} icon={AlertCircle} variant={result.success ? 'default' : 'danger'} />
            <StatsCard title="Histórico" value={Object.keys(historicoAcumulado).length} icon={History} />
          </section>

          {result.success ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
              <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border-2 border-dashed border-green-200 dark:border-green-900/30 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">DOI Validada!</h2>
                <p className="text-gray-500 max-w-sm mt-2 text-sm font-medium">O lote está em conformidade com o schema JSON 2020-12 da Receita Federal.</p>
                <button onClick={() => { setResult(null); setFile(null); }} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-xs shadow-lg">Nova Auditoria</button>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-200 dark:border-gray-700">
                  <tr><th className="px-6 py-3">Referência</th><th className="px-6 py-3">Inconsistência</th><th className="px-6 py-3">Correção</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {result.erros.map((erro, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-black text-orange-500 flex items-center gap-1 mb-1 tracking-tighter uppercase">DECLARAÇÃO #{(erro as any).indexDecl + 1}</div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{erro.localizacao}</div>
                        <div className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{erro.tipoAto}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">{erro.mensagemDeErro}</div>
                        <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{erro.tipoDeErro}</div>
                      </td>
                      <td className="px-6 py-4">
                        {erro.opcoesAceitas ? (
                          <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white" value={correcoesManuais[idx] || ''} onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [idx]: e.target.value }))}>
                            <option value="">Selecione...</option>
                            {erro.opcoesAceitas.map((opt: any, i: number) => <option key={i} value={typeof opt === 'object' ? opt.id : opt}>{typeof opt === 'object' ? opt.label : opt}</option>)}
                          </select>
                        ) : (
                          <input type="text" placeholder="Ajustar valor..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white" value={correcoesManuais[idx] || ''} onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [idx]: e.target.value }))} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)] rounded-[2rem] overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-2xl">
              <Editor height="100%" defaultLanguage="json" theme="vs-dark" value={jsonCode} onMount={(e) => (editorRef.current = e)} options={{ fontSize: 16, fontWeight: 'bold', automaticLayout: true }} />
            </div>
          )}
        </div>

        <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} historico={historicoAcumulado} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)] bg-gray-50/30 dark:bg-transparent text-gray-900 dark:text-white transition-colors">
      <div className="max-w-xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-2">
            <FileJson size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">Módulo <span className="text-orange-500">DOI</span></h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-8 leading-relaxed">Auditoria instantânea de lotes para a Receita Federal com suporte a higienização de sistemas legados.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }} className={`relative flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all group ${dragActive ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/5' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400/50'}`}>
            <input type="file" accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
            <div className={`p-4 rounded-full mb-4 shadow-sm transition-all ${file ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-orange-400'}`}><FileJson size={32} strokeWidth={2.5} /></div>
            <h3 className="text-base font-bold tracking-tight">{file ? file.name : 'Selecionar Lote JSON'}</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">{file ? 'Pronto para auditoria' : 'Arraste o arquivo JSON da DOI aqui'}</p>
          </div>
          <button onClick={handleValidate} disabled={loading || !file} className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${loading ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait' : !file ? 'bg-gray-50 dark:bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]'}`}>
            {loading ? <Activity className="animate-spin" size={18} /> : <Search size={18} />}
            {loading ? 'Processando...' : 'Iniciar Auditoria'}
          </button>
        </div>
      </div>
    </div>
  );
}