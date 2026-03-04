import { useState, useRef } from 'react';
import { ShieldCheck, List, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

// Importação dos Componentes Modulares
import { CensecToolbar } from '../components/Censec/CensecToolbar';
import { AtoAccordion } from '../components/Censec/AtoAccordion';

import { StatsCard } from '../components/StatsCard';
import { HistoryModal } from '../components/HistoryModal';
import { validarCesdiService, corrigirCesdiService } from '../services/api';
import type { ApiResponseCensec, InstrucaoCorrecao, AtoAgrupado } from '../types';
import { formatXML } from '../utils/xmlHelpers';
import { CensecUpload } from '../components/Censec/CensecUpload';

export default function CesdiCensec() {
    const editorRef = useRef<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [xmlCode, setXmlCode] = useState<string>("");
    const [result, setResult] = useState<ApiResponseCensec | null>(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'audit' | 'code'>('audit');
    const [correcoesManuais, setCorrecoesManuais] = useState<Record<number, string>>({});
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Lógica: Erros de 'Regra de Negócio' não bloqueiam a exportação (são estruturais)
    const todosErrosRespondidos = result ?
        result.erros.every(erro =>
            erro.tipoDeErro === 'Regra de Negócio' ||
            (correcoesManuais[erro.linhaDoArquivo] && correcoesManuais[erro.linhaDoArquivo].trim() !== "")
        )
        : false;

    const processFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.xml')) return toast.error("Selecione um XML válido.");
        const reader = new FileReader();
        reader.onload = (e) => {
            const formatted = formatXML(e.target?.result as string);
            setXmlCode(formatted);
            setFile(new File([new Blob([formatted], { type: 'text/xml' })], selectedFile.name, { type: 'text/xml' }));
            setResult(null);
            setCorrecoesManuais({});
        };
        reader.readAsText(selectedFile);
    };

    const handleValidate = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const data = await validarCesdiService(file);
            setResult(data);
            data.success ? toast.success("XML CESDI válido!") : toast.warning(`${data.total_erros} inconsistências.`);
        } catch (err) {
            toast.error("Erro na validação.");
        } finally { setLoading(false); }
    };

    const handleExport = async () => {
        if (!file || !result) return;

        // Mapeamento dinâmico de campos para a API de correção
        const instrucoes: InstrucaoCorrecao[] = result.erros
            .filter(erro => correcoesManuais[erro.linhaDoArquivo] && erro.tipoDeErro !== 'Regra de Negócio')
            .map(erro => {
                const msg = erro.mensagemDeErro.toLowerCase();
                let campo = 'nome';
                if (msg.includes('responsável')) campo = 'responsavel';
                else if (msg.includes('casamento')) campo = 'dataCasamento';
                else if (msg.includes('regime')) campo = 'regimeBens';
                else if (msg.includes('qualidade') || msg.includes('advogado') || msg.includes('falecido')) campo = 'qualidade';
                else if (msg.includes('cpf') || msg.includes('documento')) campo = 'documento';

                return {
                    linhaDoArquivo: erro.linhaDoArquivo,
                    localizacao: erro.localizacao,
                    campo,
                    novoValor: correcoesManuais[erro.linhaDoArquivo]
                };
            });

        setLoading(true);
        try {
            const res = await corrigirCesdiService(file, instrucoes);
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CORRIGIDO_CESDI_${file.name}`;
            a.click();
            toast.success("Arquivo exportado com sucesso!");
            setResult({ ...result, success: true, total_erros: 0, erros: [] });
        } catch (err) {
            toast.error("Erro ao exportar arquivo corrigido.");
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

    // --- RENDER INICIAL (UPLOAD) ---
    if (!result) {
        return (
            <CensecUpload
                title={<>Módulo <span className="text-orange-500">CESDI</span></>}
                description="Auditoria de escrituras CENSEC agrupadas por Livro e Folha para serventias notariais."
                icon={ShieldCheck}
                file={file}
                loading={loading}
                onProcess={processFile}
                onValidate={handleValidate}
            />
        );
    }

    // --- RENDER AUDITORIA ---
    return (
        <div className="pb-20 bg-gray-50/30 dark:bg-transparent min-h-screen transition-colors">
            <CensecToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                onBack={() => setResult(null)}
                onExport={handleExport}
                canExport={todosErrosRespondidos}
                loading={loading}
                showActions={!result.success}
            />

            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatsCard title="Atos Processados" value={result.total_atos_agrupados} icon={List} />
                    <StatsCard title="Inconsistências" value={result.total_erros} variant={result.success ? 'default' : 'danger'} icon={AlertCircle} />
                </section>

                {viewMode === 'audit' ? (
                    <div className="space-y-4">
                        {result.atos.map((ato: AtoAgrupado) => (
                            <AtoAccordion
                                key={ato.id}
                                ato={ato}
                                isOpen={!!openAccordions[ato.id]}
                                onToggle={() => setOpenAccordions(prev => ({ ...prev, [ato.id]: !prev[ato.id] }))}
                                correcoes={correcoesManuais}
                                onUpdateCorrecao={(linha, val) => setCorrecoesManuais(prev => ({ ...prev, [linha]: val }))}
                                onGoToLine={handleGoToLine}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-[75vh] rounded-[3rem] overflow-hidden border-8 border-white dark:border-gray-800 shadow-2xl">
                        <Editor
                            height="100%"
                            defaultLanguage="xml"
                            theme="vs-dark"
                            value={xmlCode}
                            onMount={(e) => (editorRef.current = e)}
                            options={{ fontSize: 16, fontWeight: '600', padding: { top: 20 }, automaticLayout: true }}
                        />
                    </div>
                )}
            </div>

            <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} historico={{}} />
        </div>
    );
}