import { FileSpreadsheet, Download, ArrowLeft } from 'lucide-react';
import type { RegistroTabelaEmolumentos } from '../../types'; //

interface TabelaHeaderProps {
  title: string;
  registros: RegistroTabelaEmolumentos[]; //
  onBack: () => void;
}

export function TabelaHeader({ title, registros, onBack }: TabelaHeaderProps) {
  
  /**
   * Lógica de exportação: Gera um arquivo JSON com os 1.500+ registros 
   * da vigência atual selecionada.
   */
  const handleExportJson = () => {
    const dataToExport = {
      tabela: title,
      exportado_em: new Date().toISOString(),
      total_registros: registros.length,
      data: registros
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url); 
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-3 flex items-center justify-between transition-colors duration-200 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Botão de Voltar para a Listagem */}
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
          title="Voltar para a lista"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3">
          {/* Ícone do Módulo */}
          <div className="bg-orange-100 dark:bg-orange-500/20 p-1.5 rounded-md">
            <FileSpreadsheet className="text-orange-600 dark:text-orange-400" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              Vigência confirmada no Banco de Dados
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Ação de Exportação */}
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded border border-orange-100 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
        >
          <Download size={14} /> Exportar JSON
        </button>
      </div>
    </div>
  );
}