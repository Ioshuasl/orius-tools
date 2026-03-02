import React, { useEffect, useState, useRef } from 'react';
import { 
  FileText, Upload, AlertCircle, CheckCircle2, 
  Search, Trash2, FileCode, Activity, Code, 
  List, ExternalLink, ShieldCheck, X
} from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

import { validarXmlCenprotLote } from '../services/api';
import type { CenprotValidationResponse, CenprotApresentante } from '../types';
import { StatsCard } from '../components/StatsCard';
import { formatXML } from '../utils/xmlHelpers';

const Cenprot: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [xmlCode, setXmlCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CenprotValidationResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'code'>('table');

  useEffect(() => {
    const pathAtual = window.location.pathname;
    const salvos = localStorage.getItem('orius_recent_modules');
    let lista: string[] = salvos ? JSON.parse(salvos) : [];
    lista = [pathAtual, ...lista.filter(p => p !== pathAtual)].slice(0, 5);
    localStorage.setItem('orius_recent_modules', JSON.stringify(lista));
  }, []);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).filter(f => f.name.endsWith('.xml'));
      if (newFiles.length === 0) return toast.error("Selecione arquivos XML válidos.");
      
      setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
      
      const reader = new FileReader();
      reader.onload = (e) => setXmlCode(formatXML(e.target?.result as string));
      reader.readAsText(newFiles[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    if (files.length <= 1) setXmlCode("");
  };

  const handleValidate = async () => {
    if (files.length === 0) return toast.error("Selecione ao menos um arquivo.");
    setLoading(true);

    try {
      const response = await validarXmlCenprotLote(files);
      setResult(response);
      response.erros.length === 0 
        ? toast.success("Assinaturas validadas!") 
        : toast.warning(`${response.erros.length} inconsistências.`);
    } catch (err: any) {
      toast.error(err.response?.data?.mensagem || "Erro no processamento.");
    } finally {
      setLoading(false);
    }
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
        {/* Header de Navegação Superior */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between transition-colors">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}
            >
              <List size={14} className="inline mr-1" /> Auditoria
            </button>
            <button 
              onClick={() => setViewMode('code')} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}
            >
              <Code size={14} className="inline mr-1" /> Código
            </button>
          </div>
          <button 
            onClick={() => { setResult(null); setFiles([]); }} 
            className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Novo Lote
          </button>
        </div>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Cartões de Estatísticas */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard title="Títulos" value={result.totalTitulosGeral} icon={FileText} />
            <StatsCard title="Arquivos" value={result.totalArquivosProcessados} icon={CheckCircle2} />
            <StatsCard title="Erros" value={result.erros.length} icon={AlertCircle} variant={result.erros.length === 0 ? 'default' : 'danger'} />
            <StatsCard title="Apresentantes" value={result.apresentantes.length} icon={Search} />
          </section>

          {viewMode === 'table' ? (
            <div className="space-y-6">
              {/* Banner de Feedback Rápido */}
              {result.erros.length === 0 ? (
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 border-dashed border-green-200 dark:border-green-900/30 flex items-center gap-6 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center flex-shrink-0"><ShieldCheck size={24} /></div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">Assinaturas Válidas</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Todos os títulos processados possuem integridade digital garantida.</p>
                    </div>
                 </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden shadow-sm">
                  <div className="bg-red-50 dark:bg-red-900/10 px-6 py-3 border-b border-red-200 dark:border-red-900/30 flex items-center gap-2">
                     <AlertCircle size={16} className="text-red-600" />
                     <span className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider">Erros de Assinatura Detectados</span>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {result.erros.map((erro, idx) => (
                        <tr key={idx} className="hover:bg-red-50/30 dark:hover:bg-red-900/5 transition-colors">
                          <td className="px-6 py-4">
                            <button onClick={() => handleGoToLine(erro.linhaDoArquivo)} className="text-[9px] font-black text-orange-500 flex items-center gap-1 mb-1 hover:underline">
                              LINHA {erro.linhaDoArquivo} <ExternalLink size={10} />
                            </button>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{erro.localizacao}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-red-600 dark:text-red-400 font-bold leading-relaxed">{erro.mensagemDeErro}</td>
                          <td className="px-6 py-4 text-right text-[11px] font-medium text-gray-400 italic">{erro.nomeDaParte}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sempre exibe o Resumo do Lote (Grid de Apresentantes) */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-800 dark:text-gray-200 flex items-center gap-2 px-2 pt-4">
                  <List size={20} className="text-orange-500" /> Auditoria Detalhada
                </h3>
                {result.apresentantes.map((apres, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{apres.nome}</div>
                        <div className="text-[10px] text-gray-500 font-mono">CNPJ: {apres.cnpj}</div>
                      </div>
                      <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{apres.titulos.length} TÍTULOS</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100/50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">
                          <tr>
                            <th className="px-6 py-3">Protocolo</th>
                            <th className="px-6 py-3">Devedor</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                            <th className="px-6 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {apres.titulos.map((tit, tIdx) => (
                            <tr key={tIdx} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${tit.status === 'ERRO' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                              <td className="px-6 py-3 font-bold text-orange-600 dark:text-orange-400">{tit.protocolo}</td>
                              <td className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium truncate max-w-[200px]">{tit.devedor}</td>
                              <td className="px-6 py-3 text-right font-mono text-gray-900 dark:text-gray-100 font-bold">R$ {tit.valor}</td>
                              <td className="px-6 py-3 text-center">
                                {tit.status === 'OK' ? <CheckCircle2 size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-red-500 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)] rounded-[2rem] overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-2xl">
              <Editor 
                height="100%" 
                defaultLanguage="xml" 
                theme="vs-dark" 
                value={xmlCode} 
                onMount={(e) => (editorRef.current = e)} 
                options={{ fontSize: 15, fontWeight: 'bold', automaticLayout: true }} 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Estado Inicial: Upload
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 mb-2">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Validador <span className="text-orange-500">CENPROT</span></h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-8">
            Auditoria técnica de assinaturas digitais Chilkat para arquivos de remessa e retorno.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4 transition-colors">
          <div 
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} 
            onDragLeave={() => setDragActive(false)} 
            onDragOver={(e) => e.preventDefault()} 
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileChange(e.dataTransfer.files); }}
            className={`relative flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all group ${dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400'}`}
          >
            <input 
              type="file" 
              multiple 
              accept=".xml" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={(e) => handleFileChange(e.target.files)} 
            />
            <div className={`p-4 rounded-full mb-4 shadow-sm transition-all ${files.length > 0 ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
              <Upload size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">
              {files.length > 0 ? `${files.length} arquivos selecionados` : 'Arraste os arquivos XML'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">Limite de 4 arquivos simultâneos</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-orange-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{f.name}</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={handleValidate} 
            disabled={loading || files.length === 0} 
            className="w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-lg disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            {loading ? <Activity className="animate-spin" size={18} /> : <Search size={18} />}
            {loading ? 'Processando Lote...' : 'Validar Arquivos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cenprot;