import { ArrowLeft, CloudCheck, CloudUpload, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from '../../types';

interface EditorHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onBack: () => void;
}

export const EditorHeader = ({ breadcrumbs, isSaving, hasUnsavedChanges, onBack }: EditorHeaderProps) => (
  <header className="h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-40">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
        <ArrowLeft size={18} />
      </button>
      <Breadcrumbs items={breadcrumbs} />
    </div>

    <div className="flex items-center gap-3 pr-2">
      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${
        isSaving ? 'bg-orange-50/50 text-orange-500 border-orange-100' :
        hasUnsavedChanges ? 'bg-blue-50/50 text-blue-500 border-blue-100' :
        'bg-gray-50/50 text-gray-400 border-gray-100'
      }`}>
        {isSaving ? <><CloudUpload size={14} className="animate-bounce" /> Salvando...</> :
         hasUnsavedChanges ? <><AlertTriangle size={14} className="animate-pulse" /> Alterações Locais</> :
         <><CloudCheck size={14} className="text-green-500" /> Sincronizado</>}
      </div>
    </div>
  </header>
);