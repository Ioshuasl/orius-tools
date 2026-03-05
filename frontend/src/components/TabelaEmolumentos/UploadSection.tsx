import { useState, type DragEvent } from 'react';
import { FileSpreadsheet, Upload, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadSectionProps {
  loading: boolean;
  onCancel: () => void;
  onImport: (file: File, nome: string) => void;
}

export function UploadSection({ loading, onCancel, onImport }: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [nomeTabela, setNomeTabela] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Gerencia o estado visual do drag and drop
  const handleDrag = (e: DragEvent<HTMLDivElement>, isActive: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isActive);
  };

  // Processa o arquivo solto no componente
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Valida se o arquivo é um Excel válido (.xlsx ou .xls)
  const validateAndSetFile = (selectedFile: File) => {
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
                    
    if (!isExcel) {
      return toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls) válido.");
    }
    
    setFile(selectedFile);
    toast.success(`${selectedFile.name} selecionado.`);
  };

  const handleProcess = () => {
    if (!file) return toast.error("Selecione um arquivo Excel.");
    if (!nomeTabela.trim()) return toast.error("Dê um nome para identificar esta tabela.");
    
    onImport(file, nomeTabela); //
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[80vh] items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header do Upload */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 rounded-full mb-1">
            <Upload size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Nova Importação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Os dados serão processados e salvos permanentemente no banco de dados.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          
          {/* Campo: Nome da Tabela */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Nome da Identificação
            </label>
            <input
              type="text"
              placeholder="Ex: Tabela Oficial 2026 - Provimento 01/2026"
              value={nomeTabela}
              onChange={(e) => setNomeTabela(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Área de Drop do Arquivo */}
          <div
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all ${
              dragActive
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                : file
                  ? 'border-green-400 bg-green-50/30 dark:bg-green-500/5'
                  : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500/50'
            }`}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => e.target.files && validateAndSetFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className={`p-3 rounded-full mb-3 shadow-sm transition-colors ${
              file ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}>
              {file ? <CheckCircle2 size={24} /> : <FileSpreadsheet size={24} />}
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white text-sm text-center">
              {file ? 'Planilha Carregada' : 'Selecione a Tabela Excel'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full max-w-[200px] text-center mt-1">
              {file ? file.name : 'Arraste ou clique para buscar'}
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleProcess}
              disabled={loading || !file || !nomeTabela.trim()}
              className={`w-full py-3 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-orange-400 text-white cursor-wait'
                  : !file || !nomeTabela.trim()
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Upload size={16} />
              )}
              {loading ? 'Importando 1.538+ registros...' : 'Confirmar e Importar'}
            </button>

            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}