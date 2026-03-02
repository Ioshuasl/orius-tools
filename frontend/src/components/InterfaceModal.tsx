import { useState } from 'react';
import { Code, X, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext'; // Importando seu contexto de tema

interface InterfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  tableName: string;
}

export function InterfaceModal({ isOpen, onClose, code, tableName }: InterfaceModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[75vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Code size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white leading-none">TypeScript Interface</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">{tableName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* MONACO EDITOR */}
        <div className="flex-1 border-y border-gray-100 dark:border-gray-700 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="typescript"
            value={code}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              fontFamily: "'Fira Code', monospace",
            }}
          />
        </div>

        {/* FOOTER */}
        <div className="p-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
          <button 
            onClick={handleCopy} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:text-white transition-all shadow-sm"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}