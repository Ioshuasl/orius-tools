import { useState, useRef, useEffect } from 'react';
import {
  FileCode, Search, RefreshCcw, AlertCircle,
  Activity, Code, List,
  ExternalLink, ShieldCheck, History, Download
} from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

import { StatsCard } from '../components/StatsCard';
import { HistoryModal } from '../components/HistoryModal';
import { validarCepService, corrigirCepService } from '../services/api';
import type { ApiResponseCensec, InstrucaoCorrecao } from '../types';
import { formatXML } from '../utils/xmlHelpers';

export default function CepCensec() {
  const editorRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [xmlCode, setXmlCode] = useState<string>("");
  const [result, setResult] = useState<ApiResponseCensec | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'code'>('table');
  
  /** * ESTADO DE CORREÇÕES:
   * Chave: "linha_campo" (ex: "544_ReferenteCns") para suportar múltiplos erros na mesma linha.
   */
  const [correcoesManuais, setCorrecoesManuais] = useState<Record<string, string>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historicoAcumulado, setHistoricoAcumulado] = useState<Record<string, any>>({});

  /**
   * Identifica qual tag XML deve ser corrigida com base na mensagem do backend.
   */
  const getCampoAlvo = (msg: string) => {
    const mensagem = msg.toLowerCase();
    if (mensagem.includes("'referentetipoatocep'")) return 'ReferenteTipoAtoCep';
    if (mensagem.includes("'referentecns'")) return 'ReferenteCns';
    if (mensagem.includes("'referentelivro'")) return 'ReferenteLivro';
    if (mensagem.includes("'referentefolha'")) return 'ReferenteFolha';
    if (mensagem.includes("'naturezaescritura'")) return 'NaturezaEscritura';
    if (mensagem.includes('qualidade')) return 'ParteQualidade';
    if (mensagem.includes('documento')) return 'ParteTipoDocumento';
    if (mensagem.includes('regime')) return 'RegimeBens';
    if (mensagem.includes('cpf')) return 'ParteNumeroDocumento';
    if (mensagem.includes('usucapiao')) return 'NaturezaAtaNotarialDeUsucapiao';
    return 'RegimeBens';
  };

  /**
   * REPLICAÇÃO INTELIGENTE (Smart Sync):
   * Se preencher um campo de ato (como CNS), replica para o mesmo campo em todos os 
   * blocos do mesmo Livro/Folha.
   */
  const handleSyncCorrecao = (linha: number, valor: string, localizacao: string, mensagem: string) => {
    const campoAtual = getCampoAlvo(mensagem);
    const chaveAtual = `${linha}_${campoAtual}`;

    setCorrecoesManuais(prev => {
      const novas = { ...prev, [chaveAtual]: valor };
      
      // Replica se for o mesmo campo na mesma localização (mesmo ato)
      result?.erros.forEach(erro => {
        const campoErro = getCampoAlvo(erro.mensagemDeErro);
        const chaveErro = `${erro.linhaDoArquivo}_${campoErro}`;
        
        if (erro.localizacao === localizacao && campoErro === campoAtual && chaveErro !== chaveAtual) {
          novas[chaveErro] = valor;
        }
      });
      return novas;
    });
  };

  const todosErrosRespondidos = result ?
    result.erros.every(erro => {
      const chave = `${erro.linhaDoArquivo}_${getCampoAlvo(erro.mensagemDeErro)}`;
      return correcoesManuais[chave] && correcoesManuais[chave].trim() !== "";
    }) : false;

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xml')) return toast.error("Selecione um XML válido.");
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const formatted = formatXML(content);
      setXmlCode(formatted);
      setFile(new File([new Blob([formatted], { type: 'text/xml' })], selectedFile.name));
      setResult(null);
      setCorrecoesManuais({});
    };
    reader.readAsText(selectedFile);
  };

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await validarCepService(file);
      setResult(data);
      data.success ? toast.success("XML válido!") : toast.warning(`${data.erros.length} inconsistências.`);
    } catch (err) {
      toast.error("Erro na validação.");
    } finally { setLoading(false); }
  };

  const handleExportarOuRevalidar = async () => {
    if (!file || !result) return;

    // Constrói instruções com campo e localização.
    const instrucoes: InstrucaoCorrecao[] = result.erros
      .map(erro => {
        const campo = getCampoAlvo(erro.mensagemDeErro);
        const valor = correcoesManuais[`${erro.linhaDoArquivo}_${campo}`];
        if (!valor) return null;
        return { 
          linhaDoArquivo: erro.linhaDoArquivo, 
          localizacao: erro.localizacao, 
          campo, 
          novoValor: valor 
        };
      })
      .filter((i): i is InstrucaoCorrecao => i !== null);

    setLoading(true);
    try {
      const response = await corrigirCepService(file, instrucoes);

      if (response.valid || response.errorCount === 0) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CORRIGIDO_${file.name}`;
        a.click();
        toast.success("XML exportado com sucesso!");
        setResult({ success: true, total_atos_agrupados: result.total_atos_agrupados, total_erros: 0, erros: [] });
      } else {
        toast.warning(`Restam ${response.errorCount} ajustes.`);
        const novoArquivo = new File([response.data], file.name, { type: 'text/xml' });
        setFile(novoArquivo);
        const data = await validarCepService(novoArquivo);
        setResult(data);
        setCorrecoesManuais({}); 
      }
    } catch (err) {
      toast.error("Erro ao aplicar correções.");
    } finally { setLoading(false); }
  };

  const handleGoToLine = (linha: number) => {
    setViewMode('code');
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(linha);
        editorRef.current.setPosition({ lineNumber: linha, column: 1 });
        editorRef.current.focus();
      }
    }, 150);
  };

  if (result) {
    return (
      <div className="pb-20 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><List size={14} className="inline mr-1" /> Auditoria</button>
            <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><Code size={14} className="inline mr-1" /> Código</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setResult(null); setFile(null); }} className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Voltar</button>
            {!result.success && (
              <button
                onClick={handleExportarOuRevalidar}
                disabled={loading || !todosErrosRespondidos}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${!todosErrosRespondidos ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
              >
                {loading ? <RefreshCcw className="animate-spin" size={14} /> : <Download size={14} />}
                {todosErrosRespondidos ? 'Exportar XML' : 'Preencha para Exportar'}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Atos" value={result.total_atos_agrupados} icon={Search} />
            <StatsCard title="Erros" value={result.total_erros} icon={AlertCircle} variant={result.success ? 'default' : 'danger'} />
            <StatsCard title="Status" value={result.success ? "Válido" : "Inconsistente"} icon={ShieldCheck} />
          </section>

          {result.success ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border-2 border-dashed border-green-200 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4"><ShieldCheck size={32} /></div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Concluído!</h2>
              <button onClick={() => { setResult(null); setFile(null); }} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs shadow-lg">Novo Arquivo</button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-200 dark:border-gray-700">
                  <tr><th className="px-6 py-3">Localização</th><th className="px-6 py-3">Inconsistência</th><th className="px-6 py-3">Correção</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {result.erros.map((erro, idx) => {
                    const campo = getCampoAlvo(erro.mensagemDeErro);
                    const chave = `${erro.linhaDoArquivo}_${campo}`;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                        <td className="px-6 py-4">
                          <button onClick={() => handleGoToLine(erro.linhaDoArquivo)} className="text-[9px] font-black text-orange-500 flex items-center gap-1 mb-1 tracking-tighter hover:underline">LINHA {erro.linhaDoArquivo} <ExternalLink size={10} /></button>
                          <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{erro.localizacao}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{erro.nomeDaParte || 'Ato Notarial'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">{erro.mensagemDeErro}</div>
                          <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{erro.tipoAto}</div>
                        </td>
                        <td className="px-6 py-4">
                          {erro.opcoesAceitas ? (
                            <select
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500"
                              value={correcoesManuais[chave] || ''}
                              onChange={(e) => handleSyncCorrecao(erro.linhaDoArquivo, e.target.value, erro.localizacao, erro.mensagemDeErro)}
                            >
                              <option value="">Selecione...</option>
                              {erro.opcoesAceitas.map((opt: any) => (
                                <option key={opt.id || opt} value={opt.id || opt}>{opt.label || opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Valor..."
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500"
                              value={correcoesManuais[chave] || ''}
                              onChange={(e) => handleSyncCorrecao(erro.linhaDoArquivo, e.target.value, erro.localizacao, erro.mensagemDeErro)}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)] rounded-[2rem] overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-2xl">
              <Editor height="100%" defaultLanguage="xml" theme="vs-dark" value={xmlCode} onMount={(e) => (editorRef.current = e)} options={{ fontSize: 16, fontWeight: 'bold', automaticLayout: true }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 mb-2"><ShieldCheck size={32} /></div>
          <h1 className="text-3xl font-black">Validador <span className="text-orange-500">CENSEC</span></h1>
          <p className="text-sm text-gray-500 font-medium px-8">Auditoria técnica instantânea de arquivos XML para a CEP.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }} className={`relative flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all group ${dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'}`}>
            <input type="file" accept=".xml" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
            <div className={`p-4 rounded-full mb-4 shadow-sm transition-all ${file ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}><FileCode size={32} /></div>
            <h3 className="text-base font-bold">{file ? file.name : 'Selecionar Arquivo XML'}</h3>
          </div>
          <button onClick={handleValidate} disabled={loading || !file} className="w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg disabled:opacity-50">
            {loading ? <Activity className="animate-spin" size={18} /> : <Search size={18} />}
            {loading ? 'Processando...' : 'Iniciar Auditoria'}
          </button>
        </div>
      </div>
    </div>
  );
}