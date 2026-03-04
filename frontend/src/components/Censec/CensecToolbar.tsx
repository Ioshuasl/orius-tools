import { List, Code, Download, RefreshCcw } from 'lucide-react';

interface ToolbarProps {
    viewMode: 'audit' | 'code';
    setViewMode: (mode: 'audit' | 'code') => void;
    onBack: () => void;
    onExport: () => void;
    canExport: boolean;
    loading: boolean;
    showActions: boolean;
}

export const CensecToolbar = ({ viewMode, setViewMode, onBack, onExport, canExport, loading, showActions }: ToolbarProps) => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm px-8 py-4 flex items-center justify-between transition-colors">
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl">
            <button onClick={() => setViewMode('audit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'audit' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-400'}`}><List size={16} /> Auditoria</button>
            <button onClick={() => setViewMode('code')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-400'}`}><Code size={16} /> Código</button>
        </div>
        <div className="flex gap-3">
            <button onClick={onBack} className="px-5 py-2 text-xs font-bold bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
            {showActions && (
                <button
                    onClick={onExport}
                    disabled={loading || !canExport}
                    className={`px-6 py-2 text-xs font-black uppercase rounded-xl shadow-lg flex items-center gap-2 transition-all ${!canExport ? 'bg-gray-300 text-gray-500' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                >
                    {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Download size={16} />}
                    {canExport ? 'Exportar Corrigido' : 'Corrija para Exportar'}
                </button>
            )}
        </div>
    </div>
);