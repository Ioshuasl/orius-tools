import { useState, useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';
import { Copy, Check, ChevronDown } from 'lucide-react';

// Importação de temas e linguagens
import 'prismjs/themes/prism-tomorrow.css'; 
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';

// Constantes de medida para garantir sincronia milimétrica
const MEASURES = {
  lineHeight: 24, // Altura da linha em pixels
  padding: 16,    // Padding interno (equivalente a p-4)
  fontSize: 14    // Tamanho da fonte fixo
};

interface CodeBlockProps {
  data: {
    code: string;
    language: string;
  };
  onUpdate: (newData: { code: string; language: string }) => void;
}

const LANGUAGES = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'markup' },
];

export function CodeBlock({ data, onUpdate }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [localCode, setLocalCode] = useState(data.code || "");
  const [activeLine, setActiveLine] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Sincroniza estado local com dados externos (carregamento inicial)
  useEffect(() => {
    if (data.code !== localCode) setLocalCode(data.code || "");
  }, [data.code]);

  const lines = useMemo(() => localCode.split('\n'), [localCode]);

  // Gera o HTML colorido via Prism
  const highlightedCode = useMemo(() => {
    const lang = Prism.languages[data.language] || Prism.languages.javascript;
    return Prism.highlight(localCode || "", lang, data.language) + "\n";
  }, [localCode, data.language]);

  // Identifica a linha onde o cursor está posicionado
  const updateActiveLine = (e: any) => {
    const textBeforeCursor = e.target.value.substring(0, e.target.selectionStart);
    const lineNumber = textBeforeCursor.split('\n').length - 1;
    setActiveLine(lineNumber);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalCode(val);
    updateActiveLine(e);
    onUpdate({ ...data, code: val });
    // Notifica o sistema de autosave do NÚCLEO GÊNESIS
    e.target.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group/code relative my-6 font-mono text-[14px] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden bg-[#f7f6f3] dark:bg-[#1e1e1e] shadow-sm transition-colors">
      
      {/* Header do Bloco */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#f1f1ef] dark:bg-[#252525] border-b border-gray-200 dark:border-gray-800">
        <div className="relative flex items-center gap-2">
          <select
            value={data.language}
            onChange={(e) => onUpdate({ ...data, language: e.target.value })}
            className="appearance-none bg-transparent pl-2 pr-6 py-1 text-[11px] font-sans font-medium text-gray-500 dark:text-gray-400 outline-none cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} className="dark:bg-[#252525]">{l.label}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <button onClick={handleCopy} className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex relative min-h-[100px]">
        
        {/* Coluna de Números de Linha */}
        <div 
          className="py-[16px] text-right text-gray-400 dark:text-gray-600 select-none bg-gray-100/30 dark:bg-black/10 border-r border-gray-200 dark:border-gray-800 min-w-[45px]"
          style={{ lineHeight: `${MEASURES.lineHeight}px` }}
        >
          {lines.map((_, i) => (
            <div 
              key={i} 
              className="px-3 flex items-center justify-end"
              style={{ height: `${MEASURES.lineHeight}px` }}
            >
              <span className={`${activeLine === i ? 'text-gray-900 dark:text-gray-100 font-bold' : ''}`}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="relative flex-grow grid overflow-hidden">
          {/* Barra de Destaque da Linha Ativa */}
          <div 
            className="absolute w-full bg-gray-400/10 dark:bg-white/5 pointer-events-none transition-all duration-75"
            style={{ 
              height: `${MEASURES.lineHeight}px`, 
              top: `${(activeLine * MEASURES.lineHeight) + MEASURES.padding}px`, 
            }}
          />

          {/* Camada 1: Textarea (Interação e Digitação) */}
          <textarea
            ref={textAreaRef}
            value={localCode}
            onChange={handleChange}
            onKeyUp={updateActiveLine}
            onClick={updateActiveLine}
            spellCheck={false}
            className="col-start-1 row-start-1 w-full m-0 bg-transparent text-transparent caret-gray-900 dark:caret-white outline-none z-10 font-mono overflow-hidden whitespace-pre border-none ring-0 focus:ring-0"
            style={{ 
              WebkitTextFillColor: 'transparent', 
              gridArea: '1 / 1 / 2 / 2',
              lineHeight: `${MEASURES.lineHeight}px`,
              padding: `${MEASURES.padding}px`,
              fontSize: `${MEASURES.fontSize}px`,
              verticalAlign: 'top', // Garante alinhamento ao topo
              boxSizing: 'content-box' // Isola o padding da altura da linha
            }}
          />
          
          {/* Camada 2: Pre (Visualização Colorida) */}
          <pre
            className={`col-start-1 row-start-1 m-0 language-${data.language} font-mono whitespace-pre z-0 pointer-events-none overflow-hidden`}
            style={{ 
              gridArea: '1 / 1 / 2 / 2', 
              backgroundColor: 'transparent',
              lineHeight: `${MEASURES.lineHeight}px`,
              padding: `${MEASURES.padding}px`,
              fontSize: `${MEASURES.fontSize}px`,
              verticalAlign: 'top',
              boxSizing: 'content-box'
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
      </div>
    </div>
  );
}