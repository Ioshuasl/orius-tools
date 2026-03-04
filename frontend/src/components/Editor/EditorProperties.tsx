import React from 'react';
import { Settings2, Hash, X, ChevronDown } from 'lucide-react';
import type { CommunityPage } from '../../types';

interface EditorPropertiesProps {
  page: CommunityPage;
  onChange: (updates: Partial<CommunityPage>, immediateHistory?: boolean) => void;
}

export const EditorProperties: React.FC<EditorPropertiesProps> = ({ page, onChange }) => {
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim().toUpperCase();
      if (val && !page.tags.includes(val)) {
        onChange({ tags: [...(page.tags || []), val] });
        e.currentTarget.value = '';
      }
    } else if (e.key === 'Backspace' && e.currentTarget.value === '' && page.tags.length) {
      const newTags = [...page.tags];
      newTags.pop();
      onChange({ tags: newTags });
    }
  };

  const removeTag = (tagIndex: number) => {
    const newTags = page.tags.filter((_, i) => i !== tagIndex);
    onChange({ tags: newTags });
  };

  return (
    <div className="space-y-6">
      {/* Título da Página */}
      <input
        value={page.title || ''}
        onChange={(e) => onChange({ title: e.target.value }, false)}
        className="w-full bg-transparent border-none outline-none font-black text-4xl text-gray-900 dark:text-white mb-2 focus:ring-0 placeholder:text-gray-100 dark:placeholder:text-gray-800"
        placeholder="Título da Página..."
      />

      {/* Propriedades Estilo Notion */}
      <div className="mt-4 mb-10 space-y-0.5 border-t border-gray-100 dark:border-gray-800 pt-8">
        
        {/* Propriedade: Sistema */}
        <div className="flex items-center group px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors duration-200">
          <div className="flex items-center gap-2 w-36 shrink-0 text-gray-400 dark:text-gray-500">
            <Settings2 size={14} />
            <span className="text-sm font-medium">Sistema</span>
          </div>

          <div className="relative flex-1">
            <select
              value={page.system || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                onChange({ system: newValue === "" ? null : newValue });
              }}
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded px-2 py-0.5 -ml-2 transition-all appearance-none"
            >
              <option value="" className="dark:bg-gray-800">Geral</option>
              {[
                'TABELIONATO DE NOTAS',
                'PROTESTO DE TÍTULOS',
                'REGISTRO CIVIL',
                'REGISTRO DE IMÓVEIS',
                'REGISTRO DE TÍTULOS E DOCUMENTO',
                'CAIXA',
                'NOTA FISCAL'
              ].map(sys => (
                <option key={sys} value={sys} className="dark:bg-gray-800">{sys}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
        </div>

        {/* Propriedade: Tags */}
        <div className="flex items-start group px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors duration-200">
          <div className="flex items-center gap-2 w-36 shrink-0 text-gray-400 dark:text-gray-500 mt-1">
            <Hash size={14} />
            <span className="text-sm font-medium">Tags</span>
          </div>

          <div className="flex flex-wrap gap-1.5 flex-1 items-center min-h-[28px]">
            {page.tags.map((tag, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-md text-xs font-semibold border border-orange-100 dark:border-orange-500/20 group/tag transition-all"
              >
                {tag}
                <button
                  onClick={() => removeTag(idx)}
                  className="hover:bg-orange-200 dark:hover:bg-orange-500/30 rounded-sm p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            <input
              type="text"
              placeholder="Adicionar tag..."
              className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 min-w-[140px] h-full"
              onKeyDown={handleTagKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};