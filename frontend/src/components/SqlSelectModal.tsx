import { useState, useMemo } from 'react';
import { 
  Database, X, Copy, Check, ListFilter, Braces, 
  Link as LinkIcon, CheckSquare, Square, Filter, 
  Trash2, Zap 
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../contexts/ThemeContext';

interface Column {
  nome: string;
  tipo: string;
  fk?: { referencia_tabela: string; referencia_coluna: string };
}

interface FilterItem {
  column: string;
  operator: '=' | 'LIKE';
}

interface SqlSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  columns: Column[];
}

export function SqlSelectModal({ isOpen, onClose, tableName, columns }: SqlSelectModalProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  
  // Estados do Assistente
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [usePagination, setUsePagination] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [activeJoins, setActiveJoins] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

  // Handlers de Seleção de Colunas
  const toggleColumn = (colName: string) => {
    const lower = colName.toLowerCase();
    setSelectedCols(prev => 
      prev.includes(lower) ? prev.filter(c => c !== lower) : [...prev, lower]
    );
  };

  const selectAllColumns = () => setSelectedCols(columns.map(c => c.nome.toLowerCase()));
  const clearColumns = () => setSelectedCols([]);

  // Handlers de Filtros
  const addFilter = (column: string, operator: '=' | 'LIKE') => {
    setActiveFilters(prev => [...prev, { column: column.toLowerCase(), operator }]);
  };

  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Lógica de Geração do Script SQL
  const sqlScript = useMemo(() => {
    // Se nada estiver selecionado, usa o caractere curinga '*'
    const colsDisplay = selectedCols.length > 0 
      ? `  ${selectedCols.join(',\n  ')}` 
      : '  *';

    let query = `-- Assistente de select Orius (Firebird 4.0.5)\n`;
    query += `SELECT\n${colsDisplay}\nFROM ${tableName}`;

    // Construção Dinâmica de JOINs
    activeJoins.forEach(joinTable => {
      const fkCol = columns.find(c => c.fk?.referencia_tabela === joinTable);
      if (fkCol) {
        query += `\nINNER JOIN ${joinTable} ON ${joinTable}.${fkCol.fk?.referencia_coluna.toLowerCase()} = ${tableName}.${fkCol.nome.toLowerCase()}`;
      }
    });

    // Construção Dinâmica de Cláusulas WHERE
    if (activeFilters.length > 0) {
      const conditions = activeFilters.map(f => `${f.column} ${f.operator} ?`);
      query += `\nWHERE ${conditions.join('\n  AND ')}`;
    }

    // Paginação Moderna (Firebird 4.0+)
    if (usePagination) {
      query += `\nOFFSET 0 ROWS FETCH NEXT ${rowsPerPage} ROWS ONLY`;
    }

    return query + ';';
  }, [tableName, selectedCols, usePagination, rowsPerPage, activeJoins, activeFilters, columns]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-500/20">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white leading-none">Assistente de Select</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-semibold">{tableName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL EM SPLIT */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* BARRA LATERAL DE CONFIGURAÇÕES */}
          <div className="w-96 border-r border-gray-100 dark:border-gray-700 p-5 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/20 space-y-8">
            
            {/* FILTROS (WHERE) */}
            <section>
              <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                <Filter size={14} className="text-blue-500" /> Filtros Rápidos (WHERE)
              </label>
              
              <div className="space-y-2 mb-4">
                {activeFilters.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-blue-500/5 border border-blue-200 dark:border-blue-500/30 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 animate-in slide-in-from-left-2 duration-200">
                    <span className="font-mono font-bold">{f.column} {f.operator} ?</span>
                    <button onClick={() => removeFilter(i)} className="p-1 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Adicionar Condição</span>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {columns.map(col => (
                    <div key={col.nome} className="flex items-center justify-between group p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                      <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">{col.nome.toLowerCase()}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => addFilter(col.nome, '=')} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-[10px] font-bold rounded hover:bg-blue-600 hover:text-white transition-colors">=</button>
                        <button onClick={() => addFilter(col.nome, 'LIKE')} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-[10px] font-bold rounded hover:bg-blue-600 hover:text-white transition-colors">LIKE</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SELEÇÃO DE COLUNAS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <ListFilter size={14} className="text-orange-500" /> Seleção de Colunas
                </label>
                <div className="flex gap-3">
                  <button onClick={selectAllColumns} className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-tighter transition-colors">Tudo</button>
                  <button onClick={clearColumns} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-tighter transition-colors">Limpar</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-2">
                {columns.map(col => {
                  const isSelected = selectedCols.includes(col.nome.toLowerCase());
                  return (
                    <button 
                      key={col.nome} 
                      onClick={() => toggleColumn(col.nome)} 
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] border transition-all ${
                        isSelected 
                          ? 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/30' 
                          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-orange-200'
                      }`}
                    >
                      {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                      <span className="truncate font-mono">{col.nome.toLowerCase()}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* RELACIONAMENTOS (JOIN) */}
            <section>
              <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                <LinkIcon size={14} className="text-purple-500" /> Sugestões de Join
              </label>
              <div className="space-y-2">
                {columns.filter(c => c.fk).map(col => (
                  <button
                    key={col.fk?.referencia_tabela}
                    onClick={() => {
                      const table = col.fk?.referencia_tabela!;
                      setActiveJoins(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-[10px] transition-all group ${
                      activeJoins.includes(col.fk?.referencia_tabela!)
                        ? 'bg-purple-500/10 border-purple-200 text-purple-600'
                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold uppercase tracking-tight italic">Relacionar com</span>
                      <Zap size={10} className={activeJoins.includes(col.fk?.referencia_tabela!) ? 'fill-current' : 'opacity-0 group-hover:opacity-100'} />
                    </div>
                    <div className="truncate uppercase font-mono font-bold">{col.fk?.referencia_tabela}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* PAGINAÇÃO */}
            <section className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl shadow-black/10">
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                <Braces size={12} /> Paginação (OFFSET)
              </label>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium">Habilitar Limite</span>
                <input 
                  type="checkbox" 
                  checked={usePagination} 
                  onChange={e => setUsePagination(e.target.checked)} 
                  className="w-4 h-4 rounded accent-orange-500" 
                />
              </div>
              {usePagination && (
                <div className="space-y-2">
                   <p className="text-[9px] text-gray-500 uppercase font-bold">Linhas por página</p>
                   <input 
                    type="number" 
                    value={rowsPerPage} 
                    onChange={e => setRowsPerPage(Number(e.target.value))} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500" 
                  />
                </div>
              )}
            </section>
          </div>

          {/* ÁREA DO EDITOR MONACO */}
          <div className="flex-1 bg-white dark:bg-[#1e1e1e] flex flex-col relative">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={sqlScript}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 24, bottom: 24 },
                lineNumbers: 'on',
                automaticLayout: true,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
              }}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex flex-col">
            <p className="text-[11px] text-gray-500 font-medium">
              {selectedCols.length === 0 ? 'Nenhuma coluna selecionada: Usando * por padrão.' : `${selectedCols.length} colunas no script.`}
            </p>
            <p className="text-[9px] text-gray-400 italic">Padrão Firebird 4.0.5 via Assistente ORIUS</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:text-white transition-all shadow-sm active:scale-95"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copiado!' : 'Copiar Script'}
            </button>
            <button 
              onClick={onClose} 
              className="px-8 py-2.5 text-sm font-bold bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Fechar Assistente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}