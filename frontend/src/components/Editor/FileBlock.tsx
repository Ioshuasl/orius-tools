import { useState, useEffect } from 'react';
import { 
  FileText, 
  DownloadCloud, 
  Loader2, 
  File as FileIcon, 
  ExternalLink, 
  Maximize2, 
  X, 
  Eye
} from 'lucide-react';
import { MediaWrapper } from './MediaWrapper';
import { generatePdfThumbnail } from '../../utils/pdfPreviewHandler';
import { api } from '../../services/api';

interface FileBlockProps {
    data: {
        url: string;
        filename?: string;
        size?: number;
        mimetype?: string;
        thumbnail?: string; // Base64 da primeira página
    };
    localMeta?: { name: string; size: number } | null;
    previewUrl?: string | null;
    onUpdate: (newData: any) => void;
    onUpload: (file: File) => Promise<void>;
    isUploading?: boolean;
}

export function FileBlock({
    data,
    localMeta,
    previewUrl,
    onUpdate,
    onUpload,
    isUploading = false
}: FileBlockProps) {
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Identifica se o arquivo é PDF pelo mimetype ou extensão
    const isPdf = data.mimetype === 'application/pdf' || 
                localMeta?.name.toLowerCase().endsWith('.pdf') ||
                data.filename?.toLowerCase().endsWith('.pdf');

    // Constrói a URL completa baseada na configuração do axios
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    const fullFileUrl = data.url ? `${baseUrl}${data.url}` : null;

    const handleRemove = () => {
        onUpdate({
            url: "",
            filename: "",
            size: 0,
            mimetype: "",
            thumbnail: ""
        });
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes || bytes === 0) return "---";
        const kb = bytes / 1024;
        if (kb > 1024) return `${(kb / 1024).toFixed(2)} MB`;
        return `${kb.toFixed(1)} KB`;
    };

    const displayFilename = data.filename || localMeta?.name || (isUploading ? "Processando..." : "Arquivo sem nome");
    const displaySize = data.size || localMeta?.size || 0;
    const hasContent = !!data.url || !!previewUrl;

    // Efeito para recuperar thumbnail caso o PDF exista mas não tenha preview salvo
    useEffect(() => {
        let isMounted = true;

        const recoverThumbnail = async () => {
            if (isPdf && data.url && !data.thumbnail && !isUploading) {
                try {
                    const response = await fetch(`${baseUrl}${data.url}`);
                    const blob = await response.blob();
                    const file = new File([blob], "preview.pdf", { type: 'application/pdf' });
                    
                    const thumb = await generatePdfThumbnail(file);
                    
                    if (thumb && isMounted) {
                        onUpdate({ ...data, thumbnail: thumb });
                    }
                } catch (err) {
                    console.error("Erro ao gerar preview automático:", err);
                }
            }
        };

        recoverThumbnail();
        return () => { isMounted = false; };
    }, [data.url, data.thumbnail, isPdf, isUploading, baseUrl]);

    return (
        <MediaWrapper
            hasUrl={hasContent}
            isUploading={isUploading}
            onRemove={handleRemove}
            onUpload={onUpload}
            label="Anexar PDF ou Documento"
            icon={<FileIcon size={28} />}
        >
            {isPdf && (data.thumbnail || isNavigating) ? (
                /* --- MODO PDF: PREVIEW OU NAVEGAÇÃO --- */
                <div className="relative group/pdf w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm transition-all">
                    
                    {isNavigating ? (
                        /* Visualizador Interativo */
                        <div className="relative w-full h-[650px] animate-in fade-in zoom-in-95 duration-300">
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsNavigating(false); }}
                                    className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all shadow-lg"
                                    title="Fechar Navegação"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <iframe 
                                src={`${fullFileUrl}#toolbar=1&navpanes=0`} 
                                className="w-full h-full border-none"
                                title="PDF Navigator"
                            />
                        </div>
                    ) : (
                        /* Thumbnail de Capa */
                        <div 
                            className="relative w-full min-h-[250px] max-h-[550px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-start justify-center cursor-pointer group/thumb"
                            onClick={() => setIsNavigating(true)}
                        >
                            <img 
                                src={data.thumbnail} 
                                alt="PDF Preview" 
                                className="w-full h-auto object-contain transition-all duration-500 group-hover/pdf:brightness-90"
                            />

                            {/* Overlay Central ao passar o mouse */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-all duration-300">
                                <div className="px-6 py-3 bg-orange-500 text-white rounded-full font-black text-sm shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover/thumb:translate-y-0 transition-transform">
                                    <Eye size={18} />
                                    CLIQUE PARA NAVEGAR NO DOCUMENTO
                                </div>
                            </div>

                            {/* Barra de Informações Inferior */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
                                <div className="text-white">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-red-600 text-[9px] text-white font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">PDF</span>
                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{formatFileSize(displaySize)}</span>
                                    </div>
                                    <h4 className="font-bold text-base truncate max-w-[300px] lg:max-w-[500px]">{displayFilename}</h4>
                                </div>
                                
                                <div className="flex gap-2">
                                    <a
                                        href={fullFileUrl || '#'}
                                        download={displayFilename}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-3 bg-white/10 hover:bg-orange-500 text-white rounded-full transition-all backdrop-blur-md border border-white/20"
                                        title="Baixar Arquivo"
                                    >
                                        <DownloadCloud size={20} />
                                    </a>
                                    <a
                                        href={fullFileUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/20"
                                        title="Abrir em nova aba"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* --- MODO CARD: OUTROS ARQUIVOS (ZIP, DOCX, ETC) --- */
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group/file ${
                    isUploading
                        ? 'bg-orange-50/30 dark:bg-orange-950/10 border-orange-200/50'
                        : 'bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}>
                    <div className={`p-3.5 rounded-xl shadow-sm border transition-all ${
                        isUploading
                            ? 'bg-orange-500 text-white animate-pulse'
                            : 'bg-white dark:bg-gray-800 text-orange-500 border-gray-100 dark:border-gray-700'
                    }`}>
                        {isUploading ? <Loader2 size={26} className="animate-spin" /> : <FileText size={26} />}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-bold truncate ${
                            isUploading ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                            {displayFilename}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                {formatFileSize(displaySize)}
                            </p>
                            {isUploading && (
                                <span className="text-[9px] text-orange-500 font-black uppercase animate-pulse">Sincronizando...</span>
                            )}
                        </div>
                    </div>

                    {!isUploading && data.url && (
                        <a
                            href={fullFileUrl || '#'}
                            download={displayFilename}
                            className="p-3 hover:bg-orange-500 hover:text-white rounded-full transition-all text-gray-400 border border-transparent hover:border-orange-200 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DownloadCloud size={20} />
                        </a>
                    )}
                </div>
            )}
        </MediaWrapper>
    );
}