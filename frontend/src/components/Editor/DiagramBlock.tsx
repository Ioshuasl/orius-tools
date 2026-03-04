import { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Maximize2, Minimize2, Loader2 } from 'lucide-react';

// 🔥 Essencial para evitar o bug dos ícones gigantes
import "@excalidraw/excalidraw/index.css";

interface DiagramBlockProps {
  data: any;
  onUpdate: (data: any, immediate?: boolean) => void;
}

export const DiagramBlock = memo(({ data, onUpdate }: DiagramBlockProps) => {
  const [isFull, setIsFull] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 🛡️ TRAVA DE LOOP: Armazena a string do último conteúdo enviado ao banco
  const lastSavedRef = useRef<string>(JSON.stringify(data || {}));

  // 🎨 PADRÕES VISUAIS FIXOS 
  // Usamos "as any" nos valores literais para corrigir o erro de atribuição do TS
  const defaultAppState = useMemo(() => ({
    currentItemFontFamily: 2,
    currentItemFontSize: 20,
    currentItemTextAlign: "center",
    currentItemStrokeWidth: 4,
    currentItemStrokeStyle: "solid" as any, // Corrigido: era string, agora é StrokeStyle
    currentItemRoughness: 0,
    currentItemRoundness: "round" as any,  // Corrigido: era string, agora é Roundness
    viewModeEnabled: false,
    zenModeEnabled: false,
    gridModeEnabled: false,
  }), []);

  // ⚙️ PROCESSAMENTO INICIAL
  const initialData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) {
        return { appState: defaultAppState };
    }
    
    const parsed = JSON.parse(JSON.stringify(data));

    if (parsed.appState?.collaborators) {
      parsed.appState.collaborators = new Map(Object.entries(parsed.appState.collaborators));
    } else if (parsed.appState) {
      parsed.appState.collaborators = new Map();
    }

    return {
      elements: parsed.elements || [],
      appState: { ...defaultAppState, ...parsed.appState },
      files: parsed.files || {},
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 300);
    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (excalidrawAPI && isMounted) {
      excalidrawAPI.refresh();
    }
  }, [isFull, excalidrawAPI, isMounted]);

  const handleChange = useCallback((elements: readonly any[], appState: any, files: any) => {
    if (!excalidrawAPI) return;

    const cleanAppState = {
      theme: appState.theme,
      viewBackgroundColor: appState.viewBackgroundColor,
      currentItemFontFamily: appState.currentItemFontFamily,
      currentItemFontSize: appState.currentItemFontSize,
      currentItemTextAlign: appState.currentItemTextAlign,
      currentItemStrokeWidth: appState.currentItemStrokeWidth,
      currentItemStrokeStyle: appState.currentItemStrokeStyle,
      currentItemRoughness: appState.currentItemRoughness,
      currentItemRoundness: appState.currentItemRoundness,
      collaborators: Object.fromEntries(appState.collaborators || new Map()),
      viewModeEnabled: false
    };

    const currentContent = { elements, appState: cleanAppState, files };
    const currentContentString = JSON.stringify(currentContent);

    if (currentContentString === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      lastSavedRef.current = currentContentString;
      onUpdate(currentContent);
    }, 1500); 
  }, [excalidrawAPI, onUpdate]);

  if (!isMounted) {
    return (
      <div className="w-full h-137.5 bg-gray-50 dark:bg-gray-800/20 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800">
        <Loader2 className="text-orange-500 animate-spin mb-2" size={20} />
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Preparando Quadro...</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative group border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#121212] transition-all
        ${isFull ? 'fixed inset-0 z-9999 h-screen w-screen' : 'h-137.5 w-full mb-4 shadow-sm'}
      `}
    >
      <div className="absolute top-3 right-3 z-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          type="button"
          onClick={() => setIsFull(!isFull)}
          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-orange-500 transition-all"
        >
          {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className="w-full h-full excalidraw-container">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          langCode="pt-BR"
          theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: { saveFileToDisk: false },
              saveAsImage: true,
              toggleTheme: true
            },
          }}
        />
      </div>

      <style>{`
        .excalidraw-container .excalidraw-wrapper { 
            height: 100% !important; 
            width: 100% !important; 
        }
        .excalidraw svg {
            width: auto !important;
            height: auto !important;
        }
        .excalidraw .App-bottom-content { margin-bottom: 0; }
        .excalidraw { border: none !important; }
      `}</style>
    </div>
  );
});

DiagramBlock.displayName = 'DiagramBlock';