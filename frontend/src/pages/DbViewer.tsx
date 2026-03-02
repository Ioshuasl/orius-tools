import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  Search, Key, Link as LinkIcon, Cpu, ChevronDown, 
  Table as TableIcon, ZoomIn, ZoomOut, Maximize,
  Download, GripVertical, Code, Asterisk, 
  Database
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Panel, Group, Separator, useDefaultLayout } from 'react-resizable-panels'; 
import dbData from '../assets/db.json';
import { Mermaid } from '../components/Mermaid';
import { InterfaceModal } from '../components/InterfaceModal';
import { SqlSelectModal } from '../components/SqlSelectModal';

export function DbViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState(Object.keys(dbData)[0]);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filtragem das tabelas memorizada para garantir consistência no index
  const filteredTables = useMemo(() => {
    return Object.keys(dbData).filter(n => 
      n.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Resetar o destaque ao fechar ou mudar a pesquisa
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, isComboOpen]);

  const handleSelectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    setIsComboOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, []);

  // Lógica de teclas (Seta para baixo, cima e Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isComboOpen) {
      if (e.key === 'ArrowDown') setIsComboOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredTables.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredTables[highlightedIndex]) {
          handleSelectTable(filteredTables[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsComboOpen(false);
        break;
    }
  };

  // Efeito para scroll automático quando navegar via teclado
  useEffect(() => {
    if (highlightedIndex >= 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = container.children[highlightedIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // ID único para persistência no localStorage entre as rotas do App.tsx
  const LAYOUT_ID = "orius-db-viewer-v1";

  // Hook de persistência conforme a definição de tipos da biblioteca
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    storage: localStorage,
  });

  // Auxiliar para transformar nomes de tabelas (ex: C_BOLETO_BANCO) em PascalCase (CBoletoBanco)
  const toPascalCase = (str: string) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };

  // Mapeamento de tipos Firebird para TypeScript padrão
  const mapType = (fbType: string) => {
    const type = fbType.toUpperCase();
    if (['SMALLINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'NUMERIC', 'DECIMAL'].includes(type)) return 'number';
    if (['DATE', 'TIMESTAMP', 'TIME'].includes(type)) return 'Date';
    return 'string';
  };

  // Geração do código da interface TypeScript com atributos em lowercase
  const interfaceCode = useMemo(() => {
    const table = (dbData as any)[selectedTable];
    if (!table) return '';

    const interfaceName = `${toPascalCase(selectedTable)}Interface`;
    let code = `/**\n * Interface gerada para a tabela ${selectedTable}\n */\n`;
    code += `export interface ${interfaceName} {\n`;
    
    table.colunas.forEach((col: any) => {
      const tsType = mapType(col.tipo);
      // Atributos convertidos para lowercase para o padrão do projeto
      const isOptional = !col.obrigatorio || col.auto_increment;
      code += `  ${col.nome.toLowerCase()}${isOptional ? '?' : ''}: ${tsType};\n`;
    });
    
    code += `}`;
    return code;
  }, [selectedTable]);

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(dbData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'db.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const mermaidChart = useMemo(() => {
    const table = (dbData as any)[selectedTable];
    if (!table) return '';
    let code = 'erDiagram\n';
    code += `  ${selectedTable} {\n`;
    table.colunas.forEach((col: any) => {
      const type = col.tipo.split(' ')[0];
      const pk = col.primary_key ? 'PK' : '';
      const fk = col.fk ? 'FK' : '';
      code += `    ${type} ${col.nome} ${pk} ${fk}\n`;
    });
    code += '  }\n';
    table.colunas.forEach((col: any) => {
      if (col.fk) {
        code += `  ${selectedTable} }o--|| ${col.fk.referencia_tabela} : "via ${col.nome}"\n`;
      }
    });
    return code;
  }, [selectedTable]);

  const currentTableData = (dbData as any)[selectedTable];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 overflow-hidden relative transition-colors duration-200">
      
      {/* 1. HEADER / TOOLBAR */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-3 w-full max-w-3xl">
          <div className="relative w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Pesquisar tabela (ex: C_ALUNO)..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={searchTerm}
                onFocus={() => setIsComboOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown} // Adicionado handler de teclado
              />
              <ChevronDown className={`absolute right-3 top-2.5 text-gray-400 transition-transform ${isComboOpen ? 'rotate-180' : ''}`} size={14} />
            </div>
            {isComboOpen && (
              <div 
                ref={scrollContainerRef} // Ref para controle de scroll
                className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
              >
                {filteredTables.map((name, index) => (
                  <button 
                    key={name} 
                    type="button" 
                    onMouseDown={() => handleSelectTable(name)} 
                    onMouseEnter={() => setHighlightedIndex(index)} // Sincroniza hover com teclado
                    className={`w-full text-left px-4 py-2 text-xs border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors 
                      ${selectedTable === name ? 'text-orange-600 font-bold bg-orange-50/30' : 'text-gray-700 dark:text-gray-300'}
                      ${highlightedIndex === index ? 'bg-orange-100 dark:bg-orange-900/40' : ''} // Estilo de destaque
                    `}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white transition-all rounded-lg border border-blue-200 dark:border-blue-800/50 shadow-sm"
            >
              <Code size={14} /> <span>Ver Interface</span>
            </button>

            <button 
              onClick={() => setIsSqlModalOpen(true)} 
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-600 hover:text-white transition-all rounded-lg border border-orange-200 dark:border-orange-800/50 shadow-sm"
            >
              <Database size={14} /> <span>Script SQL</span>
            </button>
            
            <button 
              onClick={handleDownloadJson} 
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-orange-500 hover:text-white transition-all rounded-lg border border-gray-200 dark:border-gray-600 shrink-0 shadow-sm"
            >
              <Download size={14} /> <span className="hidden sm:inline">Exportar JSON</span>
            </button>
          </div>
        </div>
        <div className="hidden lg:block px-2">
           <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
              Metadata Viewer • {Object.keys(dbData).length} Tabelas
           </span>
        </div>
      </div>

      {/* 2. ÁREA DE CONTEÚDO REDIMENSIONÁVEL */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" id={LAYOUT_ID} defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged}>
          
          {/* PAINEL ESQUERDO: METADADOS DETALHADOS */}
          <Panel id="panel-metadata" defaultSize={40} minSize={30} className="flex flex-col bg-white dark:bg-gray-800 overflow-hidden shadow-inner">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-gray-800 font-bold text-sm text-gray-800 dark:text-gray-100">
              <span className="flex items-center gap-2 truncate"><TableIcon className="text-orange-500 shrink-0" size={16} /> {selectedTable}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 shadow-sm border-b dark:border-gray-700">
                  <tr className="text-[10px] uppercase text-gray-400 tracking-widest">
                    <th className="px-4 py-3 w-[45%]">Campo</th>
                    <th className="px-2 py-3 w-[25%]">Tipo</th>
                    <th className="px-2 py-3 w-[15%] text-center">Obrig.</th>
                    <th className="px-2 py-3 w-[15%] text-center">PK/FK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {currentTableData?.colunas.map((col: any) => (
                    <tr key={col.nome} className="hover:bg-orange-500/5 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-mono text-[13px] font-bold truncate text-gray-800 dark:text-gray-100" title={col.nome}>{col.nome}</div>
                        {col.default_value && <div className="text-[10px] text-gray-400 italic font-sans truncate">Def: {col.default_value}</div>}
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-[11px] font-medium uppercase truncate">
                          {col.tipo} {col.tamanho > 0 && <span className="text-gray-400 ml-1">({col.tamanho})</span>}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {col.obrigatorio ? (
                          <span title="Obrigatório" className="inline-flex items-center justify-center p-1 bg-red-50 dark:bg-red-900/20 text-red-500 rounded">
                            <Asterisk size={12} strokeWidth={3} />
                          </span>
                        ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-center gap-1.5">
                          {col.primary_key && <span title="PK" className="p-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded"><Key size={12} strokeWidth={2.5} /></span>}
                          {col.fk && <span title={`FK: ${col.fk.referencia_tabela}`} className="p-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded"><LinkIcon size={12} strokeWidth={2.5} /></span>}
                          {col.auto_increment && <span title="AI" className="p-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded"><Cpu size={12} strokeWidth={2.5} /></span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Separator className="w-1 bg-gray-100 dark:bg-gray-900 hover:bg-orange-500/40 transition-all flex items-center justify-center group relative cursor-col-resize">
            <div className="h-10 w-full flex flex-col items-center justify-center gap-1">
               <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 rounded-full transition-colors" />
               <GripVertical size={10} className="text-gray-400 group-hover:text-orange-500" />
               <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 group-hover:bg-orange-500 rounded-full transition-colors" />
            </div>
          </Separator>

          {/* PAINEL DIREITO: DIAGRAMA INTERATIVO */}
          <Panel id="panel-diagram" className="flex flex-col bg-gray-100 dark:bg-gray-950 overflow-hidden relative group">
            <TransformWrapper initialScale={1} minScale={0.1} maxScale={4} centerOnInit={true} limitToBounds={false} alignmentAnimation={{ disabled: true }} wheel={{ step: 0.1 }}>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
                    <button onClick={() => zoomIn()} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title="Zoom In"><ZoomIn size={20} /></button>
                    <button onClick={() => resetTransform()} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title="Reset"><Maximize size={20} /></button>
                    <button onClick={() => zoomOut()} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl text-gray-600 dark:text-gray-300 transition-colors" title="Zoom Out"><ZoomOut size={20} /></button>
                  </div>
                  <div className="flex-1 cursor-grab active:cursor-grabbing h-full">
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "fit-content", height: "fit-content", padding: "400px" }}>
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                        <Mermaid chart={mermaidChart} />
                      </div>
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
          </Panel>
        </Group>
      </div>

      <InterfaceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        code={interfaceCode}
        tableName={selectedTable}
      />

      <SqlSelectModal 
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        tableName={selectedTable}
        columns={currentTableData?.colunas || []}
      />

      {isComboOpen && <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsComboOpen(false)} />}
    </div>
  );
}