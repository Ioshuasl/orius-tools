import { useState, type DragEvent, useRef } from 'react';
import { 
  FileCode, Search, RefreshCcw, AlertCircle, 
  Activity, CheckCircle2, Download, Code, List,
  ExternalLink, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

import { StatsCard } from '../components/StatsCard';
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
  const [correcoesManuais, setCorrecoesManuais] = useState<Record<number, string>>({});

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xml')) {
      return toast.error("Por favor, selecione um ficheiro XML válido.");
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const formattedContent = formatXML(content); // Aplica a formatação automática
      
      setXmlCode(formattedContent);
      // Cria um novo arquivo com o conteúdo formatado para as validações da API
      const blob = new Blob([formattedContent], { type: 'text/xml' });
      setFile(new File([blob], selectedFile.name, { type: 'text/xml' }));
      setResult(null);
      setCorrecoesManuais({});
    };
    reader.readAsText(selectedFile);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setXmlCode(value);
      const blob = new Blob([value], { type: 'text/xml' });
      setFile(new File([blob], file?.name || "documento.xml", { type: 'text/xml' }));
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

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await validarCepService(file);
      setResult(data);
      data.success ? toast.success("Validação concluída!") : toast.warning(`Inconsistências detectadas.`);
    } catch (err) {
      toast.error("Erro na validação.");
    } finally { setLoading(false); }
  };

  const handleDownloadCorrigido = async () => {
    if (!file || !result) return;
    const instrucoes: InstrucaoCorrecao[] = result.erros
      .filter(erro => correcoesManuais[erro.linhaDoArquivo])
      .map(erro => ({
        linhaDoArquivo: erro.linhaDoArquivo,
        campo: erro.mensagemDeErro.toLowerCase().includes('qualidade') ? 'ParteQualidade' : 
               erro.mensagemDeErro.toLowerCase().includes('documento') ? 'ParteTipoDocumento' : 'RegimeBens',
        novoValor: correcoesManuais[erro.linhaDoArquivo]
      }));
    try {
      const blob = await corrigirCepService(file, instrucoes);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `CORRIGIDO_${file.name}`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error("Erro ao exportar."); }
  };

  // View de Resultados
  if (result && !result.success) {
    return (
      <div className="pb-20 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm px-6 py-4 flex items-center justify-between transition-colors text-gray-900 dark:text-white">
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><List size={14} className="inline mr-1"/> Auditoria</button>
            <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><Code size={14} className="inline mr-1"/> Código</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {setResult(null); setFile(null);}} className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Reiniciar</button>
            <button onClick={handleDownloadCorrigido} className="px-4 py-1.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-md flex items-center gap-2 transition-all"><Download size={14}/> Exportar XML</button>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Atos" value={result.total_atos_agrupados} icon={Search} />
            <StatsCard title="Erros" value={result.total_erros} icon={AlertCircle} variant="danger" />
            <StatsCard title="Corrigidos" value={Object.keys(correcoesManuais).length} icon={CheckCircle2} />
          </section>

          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-200 dark:border-gray-700">
                  <tr><th className="px-6 py-3">Localização</th><th className="px-6 py-3">Inconsistência</th><th className="px-6 py-3">Correção</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {result.erros.map((erro, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                      <td className="px-6 py-4">
                        <button onClick={() => handleGoToLine(erro.linhaDoArquivo)} className="text-[9px] font-black text-orange-500 flex items-center gap-1 mb-1 tracking-tighter hover:underline">LINHA {erro.linhaDoArquivo} <ExternalLink size={10}/></button>
                        <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{erro.localizacao}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[200px]">{erro.nomeDaParte || 'Ato'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">{erro.mensagemDeErro}</div>
                        <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{erro.tipoDeErro}</div>
                      </td>
                      <td className="px-6 py-4">
                        {erro.opcoesAceitas ? (
                          <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white" value={correcoesManuais[erro.linhaDoArquivo] || ''} onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [erro.linhaDoArquivo]: e.target.value }))}>
                            <option value="">Selecione...</option>
                            {erro.opcoesAceitas.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type="text" placeholder="Valor manual..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white" onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [erro.linhaDoArquivo]: e.target.value }))} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[calc(100vh-250px)] rounded-[2rem] overflow-hidden border-4 border-gray-100 dark:border-gray-800 shadow-2xl">
              <Editor 
                height="100%" 
                defaultLanguage="xml" 
                theme="vs-dark" 
                value={xmlCode} 
                onMount={(editor) => (editorRef.current = editor)} 
                onChange={handleCodeChange} 
                options={{ 
                  minimap: { enabled: true }, 
                  fontSize: 16, 
                  lineHeight: 24,
                  fontWeight: 'bold',
                  formatOnPaste: true,      // Formata ao colar conteúdo
                  formatOnType: true,       // Formata ao digitar tags
                  automaticLayout: true, 
                  wordWrap: 'on',
                  scrollBeyondLastLine: true,
                  padding: { top: 20, bottom: 20 }
                }} 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // View Inicial
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 min-h-[calc(100vh-4rem)] bg-gray-50/30 dark:bg-transparent transition-colors">
      <div className="max-w-xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-2">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">Validador <span className="text-orange-500">CENSEC</span></h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-8 leading-relaxed">Auditoria técnica instantânea de arquivos XML para a CEP conforme o manual oficial.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }} className={`relative flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all group ${dragActive ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/5' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400/50'}`}>
            <input type="file" accept=".xml" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
            <div className={`p-4 rounded-full mb-4 shadow-sm transition-all ${file ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-orange-400'}`}><FileCode size={32} strokeWidth={2.5} /></div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{file ? file.name : 'Selecionar Arquivo XML'}</h3>
            <p className="text-xs text-gray-400 font-medium mt-1">{file ? 'Pronto para validar' : 'Arraste o arquivo do sistema aqui'}</p>
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