import { useCallback, useRef, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';

interface TableBlockProps {
  data: {
    rows: string[][];
  };
  onUpdate: (newData: { rows: string[][] }) => void;
  className?: string;
}

export function TableBlock({ data, onUpdate, className }: TableBlockProps) {
  const { rows } = data;
  const tableRef = useRef<HTMLTableElement>(null);
  const rowsRef = useRef(rows);

  // Sincroniza a ref para o Autosave
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const triggerAutosave = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement) {
      const event = new Event('input', { bubbles: true, cancelable: true });
      activeElement.dispatchEvent(event);
    }
  }, []);

  const handleCellInput = (rowIndex: number, colIndex: number, htmlValue: string) => {
    rowsRef.current[rowIndex][colIndex] = htmlValue;
    onUpdate({ rows: [...rowsRef.current] });
    triggerAutosave();
  };

  // --- Lógica de Expansão ---

  const addRow = () => {
    const numCols = rows[0]?.length || 1;
    const newRows = [...rows, Array(numCols).fill("")];
    onUpdate({ rows: newRows });
    triggerAutosave();
  };

  const addColumn = () => {
    const newRows = rows.map(row => [...row, ""]);
    onUpdate({ rows: newRows });
    triggerAutosave();
  };

  const deleteRow = (idx: number) => {
    if (rows.length > 1) {
      onUpdate({ rows: rows.filter((_, i) => i !== idx) });
      triggerAutosave();
    }
  };

  const deleteColumn = (colIdx: number) => {
    if (rows[0].length > 1) {
      onUpdate({ rows: rows.map(row => row.filter((_, i) => i !== colIdx)) });
      triggerAutosave();
    }
  };

  // Lógica de foco e navegação
  const moveFocus = useCallback((r: number, c: number) => {
    setTimeout(() => {
      const targetCell = tableRef.current?.rows[r + 1]?.cells[c] as HTMLElement; 
      if (targetCell) {
        targetCell.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(targetCell);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 10);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const { key, shiftKey } = e;
    const selection = window.getSelection();
    const isAtStart = selection?.anchorOffset === 0;
    const isAtEnd = selection?.anchorOffset === (selection?.anchorNode?.textContent?.length || 0);

    if (key === 'ArrowRight' && isAtEnd) {
      if (colIndex < rows[0].length - 1) moveFocus(rowIndex, colIndex + 1);
    } else if (key === 'ArrowLeft' && isAtStart) {
      if (colIndex > 0) moveFocus(rowIndex, colIndex - 1);
    } else if (key === 'ArrowDown') {
      if (rowIndex < rows.length - 1) moveFocus(rowIndex + 1, colIndex);
    } else if (key === 'ArrowUp') {
      if (rowIndex > 0) moveFocus(rowIndex - 1, colIndex);
    } else if (key === 'Tab') {
      e.preventDefault();
      if (shiftKey) {
        if (colIndex > 0) moveFocus(rowIndex, colIndex - 1);
        else if (rowIndex > 0) moveFocus(rowIndex - 1, rows[0].length - 1);
      } else {
        if (colIndex < rows[0].length - 1) moveFocus(rowIndex, colIndex + 1);
        else if (rowIndex < rows.length - 1) moveFocus(rowIndex + 1, 0);
        else addRow(); // Tab na última célula adiciona linha
      }
    }
  };

  return (
    <div className={`group/table relative my-8 ${className || ''}`}>
      <div className="relative inline-block min-w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
        <table ref={tableRef} className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/30">
              {rows[0].map((_, colIdx) => (
                <th key={colIdx} className="group/col-header p-1 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 border-b relative">
                  <button 
                    onClick={() => deleteColumn(colIdx)} 
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/table:opacity-100 transition-all rounded-md"
                  >
                    <Trash2 size={12} />
                  </button>
                </th>
              ))}
              {/* Botão de Adicionar Coluna no final do Header */}
              <th className="w-10 border-b border-gray-100 dark:border-gray-800">
                <button 
                  onClick={addColumn}
                  className="w-full h-full flex items-center justify-center text-gray-300 hover:text-orange-500 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row border-b border-gray-100 dark:border-gray-800 last:border-0">
                {row.map((cell, colIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${colIndex}`}
                    initialValue={cell}
                    onInput={(val) => handleCellInput(rowIndex, colIndex, val)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  />
                ))}
                <td className="w-10 p-0 text-center align-middle border-none">
                  <button 
                    onClick={() => deleteRow(rowIndex)} 
                    className="p-1.5 opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Botão de Adicionar Linha no rodapé */}
        <button 
          onClick={addRow}
          className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all text-xs border-t border-transparent hover:border-orange-100 dark:hover:border-orange-900"
        >
          <Plus size={14} />
          Nova linha
        </button>
      </div>
    </div>
  );
}

// Célula otimizada para evitar re-renders desnecessários
function TableCell({ initialValue, onInput, onKeyDown }: { 
  initialValue: string, 
  onInput: (val: string) => void, 
  onKeyDown: (e: React.KeyboardEvent) => void 
}) {
  const cellRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (cellRef.current && cellRef.current.innerHTML !== initialValue) {
      cellRef.current.innerHTML = initialValue;
    }
  }, [initialValue]); 

  return (
    <td 
      ref={cellRef}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      onInput={(e) => onInput(e.currentTarget.innerHTML)}
      className="p-3 border-r border-gray-100 dark:border-gray-800 last:border-0 min-w-[150px] outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500/20 focus:bg-orange-50/10 text-sm text-gray-700 dark:text-gray-300 transition-all"
    />
  );
}