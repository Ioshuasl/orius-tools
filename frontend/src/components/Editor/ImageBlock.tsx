import { ImageIcon, Loader2 } from 'lucide-react';
import { MediaWrapper } from './MediaWrapper';

// Interface atualizada para suportar o preview em tempo real
interface ImageBlockProps {
  data: {
    url: string;
    filename?: string;
    alt?: string;
  };
  previewUrl?: string | null; // Propriedade para o Blob local
  onUpdate: (newData: any) => void;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function ImageBlock({ 
  data, 
  previewUrl, 
  onUpdate, 
  onUpload, 
  isUploading = false 
}: ImageBlockProps) {
  
  // LÓGICA DE PRIORIDADE: 
  // 1. Se houver previewUrl (arquivo recém-selecionado), usamos ele.
  // 2. Se não, usamos a URL do servidor.
  // 3. Se nenhum existir, fica nulo.
  const displayUrl = previewUrl || (data.url ? `http://192.168.32.1:3000${data.url}` : null);

  // Função para resetar o bloco ao remover a imagem
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
      hasUrl={!!displayUrl} // O Wrapper agora entende que tem conteúdo se houver preview
      isUploading={isUploading}
      onRemove={handleRemove}
      onUpload={onUpload}
      label="Upload de Imagem"
      icon={<ImageIcon size={28}/>}
    >
      <div className="relative group/image w-full bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center min-h-[100px] overflow-hidden rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-all">
        
        {displayUrl && (
          <img 
            src={displayUrl} 
            className={`w-full h-auto max-h-[600px] object-contain select-none shadow-sm transition-all duration-500 ${
              isUploading ? 'opacity-40 blur-[2px] scale-[0.98]' : 'opacity-100 blur-0 scale-100'
            }`}
            alt={data.filename || "Conteúdo da imagem"}
            loading="lazy"
          />
        )}

        {/* Overlay de carregamento centralizado */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/10 dark:bg-black/10 backdrop-blur-[1px]">
            <Loader2 className="text-orange-500 animate-spin" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded shadow-sm">
              Enviando...
            </span>
          </div>
        )}
        
        {/* Badge Notion-style com o nome do arquivo */}
        {data.filename && !isUploading && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium text-gray-600 dark:text-gray-300 opacity-0 group-hover/image:opacity-100 transition-opacity border border-gray-200 dark:border-gray-800 pointer-events-none">
            {data.filename}
          </div>
        )}
      </div>
    </MediaWrapper>
  );
}