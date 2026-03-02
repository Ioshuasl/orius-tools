import { Video, Loader2 } from 'lucide-react';
import { MediaWrapper } from './MediaWrapper';

// Interface atualizada para suportar a lógica de preview em tempo real
interface VideoBlockProps {
  data: {
    url: string;
    filename?: string;
  };
  previewUrl?: string | null; // URL temporária (blob:) para visualização imediata
  onUpdate: (newData: any) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function VideoBlock({ 
  data, 
  previewUrl, 
  onUpdate, 
  onUpload, 
  isUploading = false 
}: VideoBlockProps) {
  
  // Prioridade: Preview local > URL do servidor > null
  const displayUrl = previewUrl || (data.url ? `http://192.168.32.1:3000${data.url}` : null);

  // Limpa os metadados do bloco ao remover o vídeo
  const handleRemove = () => {
    onUpdate({ 
      url: "", 
      filename: "", 
      size: 0, 
      mimetype: "" 
    });
  };

  return (
    <MediaWrapper 
      hasUrl={!!displayUrl} 
      isUploading={isUploading}
      onRemove={handleRemove}
      onUpload={onUpload}
      label="Arraste um vídeo ou clique para upload"
      icon={<Video size={28}/>}
    >
      <div className="relative w-full bg-black/5 dark:bg-black/40 flex items-center justify-center rounded-lg overflow-hidden group/video border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
        
        {displayUrl && (
          <video 
            src={displayUrl} 
            controls 
            className={`w-full max-h-[500px] outline-none shadow-inner transition-all duration-500 ${
              isUploading ? 'opacity-40 grayscale-[0.5] scale-[0.99]' : 'opacity-100 grayscale-0 scale-100'
            }`}
          />
        )}
        
        {/* Overlay de carregamento para vídeos (essencial para arquivos grandes) */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/5 dark:bg-black/20 backdrop-blur-[2px] z-10">
            <div className="relative flex items-center justify-center">
              <Loader2 className="text-orange-500 animate-spin" size={40} />
              <Video className="absolute text-orange-500/50" size={16} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-lg border border-orange-100 dark:border-orange-900/50">
                Processando Vídeo
              </span>
            </div>
          </div>
        )}
        
        {/* Nome do arquivo estilo Notion no topo */}
        {data.filename && !isUploading && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-semibold text-white opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none border border-white/10">
            {data.filename}
          </div>
        )}
      </div>
    </MediaWrapper>
  );
}