import { type ReactNode, useRef } from 'react';
import { Trash2, Loader2, UploadCloud } from 'lucide-react';

interface MediaWrapperProps {
  children: ReactNode;           // O conteúdo específico (img, video ou card de arquivo)
  isUploading?: boolean;        // Estado de carregamento vindo do BlockRenderer
  hasUrl: boolean;              // Define se exibe o conteúdo ou o seletor de upload
  onRemove: () => void;         // Função para limpar os dados do bloco
  onUpload: (file: File) => void; // Função que chama o uploadMediaService
  label: string;                // Texto de instrução (ex: "Upload de Imagem")
  icon: ReactNode;              // Ícone correspondente ao tipo de mídia
}

export function MediaWrapper({ 
  children, 
  isUploading, 
  hasUrl, 
  onRemove, 
  onUpload, 
  label, 
  icon 
}: MediaWrapperProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      // Limpa o input para permitir subir o mesmo arquivo novamente se deletado
      e.target.value = ''; 
    }
  };

  return (
    <div className="my-4 group/media relative w-full">
      {hasUrl ? (
        /* Estado: Mídia Carregada */
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 group relative transition-all duration-300 hover:shadow-md">
          {children}          
        </div>
      ) : (
        /* Estado: Seletor de Upload / Vazio */
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer 
            transition-all duration-200 group-hover:border-orange-500/50
            ${isUploading 
              ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/10' 
              : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50'}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-orange-500 animate-spin" />
              <span className="text-xs font-bold text-orange-600 animate-pulse uppercase tracking-widest">Processando...</span>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-4 text-gray-400 group-hover:text-orange-500 transition-colors border border-gray-100 dark:border-gray-700">
                {icon}
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 block">{label}</span>
                <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">ou arraste o arquivo aqui</span>
              </div>
              
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept={label.includes('Imagem') ? 'image/*' : label.includes('Vídeo') ? 'video/*' : '*'}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}