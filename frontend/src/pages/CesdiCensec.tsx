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
import { validarCesdiService, corrigirCesdiService } from '../services/api';
import type { ApiResponseCensec, InstrucaoCorrecao } from '../types';
import { formatXML } from '../utils/xmlHelpers';

export default function CesdiCensec() {
    const editorRef = useRef<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [xmlCode, setXmlCode] = useState<string>("");
    const [result, setResult] = useState<ApiResponseCensec | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'code'>('table');
    const [correcoesManuais, setCorrecoesManuais] = useState<Record<number, string>>({});
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [historicoAcumulado, setHistoricoAcumulado] = useState<Record<number, { campo: string, valor: string, localizacao: string }>>({});

    useEffect(() => {
        const salvo = localStorage.getItem('orius_cesdi_history');
        if (salvo) {
            setHistoricoAcumulado(JSON.parse(salvo));
        }
    }, []);

    const todosErrosRespondidos = result ?
        result.erros.every(erro => correcoesManuais[erro.linhaDoArquivo] && correcoesManuais[erro.linhaDoArquivo].trim() !== "")
        : false;

    const processFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.xml')) {
            return toast.error("Por favor, selecione um ficheiro XML válido.");
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const formattedContent = formatXML(content);

            setXmlCode(formattedContent);
            const blob = new Blob([formattedContent], { type: 'text/xml' });
            setFile(new File([blob], selectedFile.name, { type: 'text/xml' }));
            setResult(null);
            setCorrecoesManuais({});

            localStorage.removeItem('orius_cesdi_history');
            setHistoricoAcumulado({});
        };
        reader.readAsText(selectedFile);
    };

    const handleValidate = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const data = await validarCesdiService(file);
            setResult(data);
            data.success ? toast.success("XML CESDI 100% válido!") : toast.warning(`${data.erros.length} inconsistências encontradas.`);
        } catch (err) {
            toast.error("Erro na validação do CESDI.");
        } finally { setLoading(false); }
    };

    const handleExportarOuRevalidar = async () => {
        if (!file || !result) return;

        const instrucoes: InstrucaoCorrecao[] = result.erros
            .filter(erro => correcoesManuais[erro.linhaDoArquivo])
            .map(erro => {
                const msg = erro.mensagemDeErro.toLowerCase();
                let campo = 'nome';

                if (msg.includes('responsável')) campo = 'responsavel';
                else if (msg.includes('casamento')) campo = 'dataCasamento';
                else if (msg.includes('regime')) campo = 'regimeBens';
                else if (msg.includes('maiores')) campo = 'filhosMaiores';
                else if (msg.includes('menores')) campo = 'filhosMenores';
                else if (msg.includes('qualidade')) campo = 'qualidade';
                else if (msg.includes('cpf') || msg.includes('documento')) campo = 'documento';

                return {
                    linhaDoArquivo: erro.linhaDoArquivo,
                    campo: campo,
                    novoValor: correcoesManuais[erro.linhaDoArquivo]
                };
            });

        const novoHistorico = { ...historicoAcumulado };
        result.erros.forEach(erro => {
            if (correcoesManuais[erro.linhaDoArquivo]) {
                novoHistorico[erro.linhaDoArquivo] = {
                    campo: instrucoes.find(i => i.linhaDoArquivo === erro.linhaDoArquivo)?.campo || 'Campo',
                    valor: correcoesManuais[erro.linhaDoArquivo],
                    localizacao: erro.localizacao
                };
            }
        });

        setHistoricoAcumulado(novoHistorico);
        localStorage.setItem('orius_cesdi_history', JSON.stringify(novoHistorico));

        setLoading(true);
        try {
            const response = await corrigirCesdiService(file, instrucoes);

            if (response.success || response.errorCount === 0) {
                const url = window.URL.createObjectURL(response.data);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `CORRIGIDO_CESDI_${file.name}`;
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 100);

                toast.success("XML CESDI Corrigido!");
                localStorage.removeItem('orius_cesdi_history');

                setResult({
                    success: true,
                    total_atos_agrupados: result.total_atos_agrupados,
                    total_erros: 0,
                    erros: []
                });
            } else {
                toast.error(`Restam ${response.errorCount} erros no CESDI.`);
                const novoArquivo = new File([response.data], file.name, { type: 'text/xml' });
                setFile(novoArquivo);

                const reader = new FileReader();
                reader.onload = (e) => setXmlCode(e.target?.result as string);
                reader.readAsText(novoArquivo);

                const data = await validarCesdiService(novoArquivo);
                setResult(data);
                setCorrecoesManuais({});
            }
        } catch (err) {
            toast.error("Erro ao processar correções CESDI.");
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (v: string | undefined) => {
        if (v) {
            setXmlCode(v);
            setFile(new File([new Blob([v], { type: 'text/xml' })], file?.name || "cesdi.xml", { type: 'text/xml' }));
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
                        <button onClick={() => setViewMode('code')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500'}`}><Code size={14} className="inline mr-1" /> Código</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setResult(null); setFile(null); localStorage.removeItem('orius_cesdi_history'); }} className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Voltar</button>

                        {!result.success && (
                            <>
                                <button
                                    onClick={() => setShowHistoryModal(true)}
                                    className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-2"
                                >
                                    <History size={14} /> Histórico
                                </button>

                                <button
                                    onClick={handleExportarOuRevalidar}
                                    disabled={loading || !todosErrosRespondidos}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${!todosErrosRespondidos ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-orange-500 text-white hover:bg-orange-600'
                                        }`}
                                >
                                    {loading ? <RefreshCcw className="animate-spin" size={14} /> : <Download size={14} />}
                                    {todosErrosRespondidos ? 'Exportar CESDI' : 'Corrija para Exportar'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatsCard title="Atos Agrupados" value={result.total_atos_agrupados} icon={Search} />
                        <StatsCard title="Inconsistências" value={result.total_erros} icon={AlertCircle} variant={result.success ? 'default' : 'danger'} />
                        <StatsCard title="Histórico" value={Object.keys(historicoAcumulado).length} icon={History} />
                    </section>

                    {result.success ? (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl border-2 border-dashed border-green-200 dark:border-green-900/30 flex flex-col items-center justify-center text-center shadow-sm">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">CESDI Validado!</h2>
                                <p className="text-gray-500 max-w-sm mt-2 text-sm font-medium">O arquivo foi auditado conforme o manual e o download realizado com sucesso.</p>
                                <button onClick={() => { setResult(null); setFile(null); }} className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold text-xs shadow-lg">Novo Arquivo</button>
                            </div>

                            {Object.keys(historicoAcumulado).length > 0 && (
                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center gap-2">
                                        <History size={16} className="text-orange-500" />
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Log de Alterações - CESDI</h3>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/30 dark:bg-gray-900/30 text-[10px] uppercase text-gray-400 font-black border-b border-gray-100 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3">Linha</th>
                                                    <th className="px-6 py-3">Campo</th>
                                                    <th className="px-6 py-3 text-right">Valor Aplicado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                                {Object.entries(historicoAcumulado).map(([linha, dados], i) => (
                                                    <tr key={i} className="text-xs hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                                                        <td className="px-6 py-4 font-mono font-bold text-orange-500">{linha}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-800 dark:text-gray-200">{dados.campo}</div>
                                                            <div className="text-[10px] text-gray-400">{dados.localizacao}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-block px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-md font-bold border border-green-100 dark:border-green-900/30">
                                                                {dados.valor}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase text-gray-400 font-black border-b border-gray-200 dark:border-gray-700">
                                    <tr><th className="px-6 py-3">Localização</th><th className="px-6 py-3">Inconsistência</th><th className="px-6 py-3">Correção</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {result.erros.map((erro, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleGoToLine(erro.linhaDoArquivo)} className="text-[9px] font-black text-orange-500 flex items-center gap-1 mb-1 tracking-tighter hover:underline">LINHA {erro.linhaDoArquivo} <ExternalLink size={10} /></button>
                                                <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{erro.localizacao}</div>
                                                <div className="text-[11px] text-gray-500 truncate max-w-[200px]">{erro.nomeDaParte || 'Ato'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-red-600 dark:text-red-400 font-bold leading-tight">{erro.mensagemDeErro}</div>
                                                <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{erro.tipoAto}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {erro.opcoesAceitas ? (
                                                    <select
                                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                                                        value={correcoesManuais[erro.linhaDoArquivo] || ''}
                                                        onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [erro.linhaDoArquivo]: e.target.value }))}
                                                    >
                                                        <option value="">Selecione uma opção...</option>
                                                        {erro.opcoesAceitas.map((opt: any, i: number) => {
                                                            const isObject = typeof opt === 'object' && opt !== null;
                                                            const value = isObject ? opt.id : opt;
                                                            const label = isObject ? opt.label : opt;
                                                            return <option key={i} value={value}>{label}</option>;
                                                        })}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Valor manual..."
                                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                                                        value={correcoesManuais[erro.linhaDoArquivo] || ''}
                                                        onChange={(e) => setCorrecoesManuais(prev => ({ ...prev, [erro.linhaDoArquivo]: e.target.value }))}
                                                    />
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
                                onMount={(e) => (editorRef.current = e)}
                                onChange={handleCodeChange}
                                options={{ fontSize: 16, fontWeight: 'bold', automaticLayout: true, wordWrap: 'on' }}
                            />
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
                        <ShieldCheck size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight leading-tight">Módulo <span className="text-orange-500">CESDI</span></h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-8 leading-relaxed">Auditoria instantânea de Escrituras de Separações, Divórcios e Inventários conforme a CENSEC.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <div onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setDragActive(false); e.dataTransfer.files[0] && processFile(e.dataTransfer.files[0]); }} className={`relative flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed rounded-2xl transition-all group ${dragActive ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/5' : 'border-gray-300 dark:border-gray-600 hover:border-orange-400/50'}`}>
                        <input type="file" accept=".xml" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && processFile(e.target.files[0])} />
                        <div className={`p-4 rounded-full mb-4 shadow-sm transition-all ${file ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-orange-400'}`}><FileCode size={32} strokeWidth={2.5} /></div>
                        <h3 className="text-base font-bold tracking-tight">{file ? file.name : 'Selecionar XML CESDI'}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">{file ? 'Pronto para auditoria' : 'Arraste o arquivo XML do CESDI aqui'}</p>
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