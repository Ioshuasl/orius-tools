import { type ReactNode, useRef } from 'react';
import { Loader2, X } from 'lucide-react'; // Adicionei o ícone X

interface MediaWrapperProps {
  children: ReactNode;
  isUploading?: boolean;
  hasUrl: boolean;
  onRemove: () => void;
  onUpload: (file: File) => void;
  label: string;
  icon: ReactNode;
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
      e.target.value = ''; 
    }
  };

  return (
    <div className="my-4 group/media relative w-full">
      {hasUrl ? (
        /* Estado: Mídia Carregada */
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 group relative transition-all duration-300 hover:shadow-md">
          {children}
          
          {/* Botão de Remover - Agora utilizando a prop onRemove */}
          {!isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:text-red-500 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              title="Remover mídia"
            >
              <X size={16} />
            </button>
          )}
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