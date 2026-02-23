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

  // Sincroniza a ref apenas se a estrutura mudar (adição/remoção), não no conteúdo
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
    // Atualizamos a Ref local imediatamente para o Autosave capturar o valor real
    rowsRef.current[rowIndex][colIndex] = htmlValue;
    onUpdate({ rows: rowsRef.current });
    triggerAutosave();
  };

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
    const cell = e.currentTarget as HTMLTableCellElement;
    const selection = window.getSelection();
    
    // Detecção de bordas para navegação inteligente
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
        else {
          addRow();
          moveFocus(rowIndex + 1, 0);
        }
      }
    }
  };

  const addRow = () => {
    const newRows = [...rowsRef.current, Array(rowsRef.current[0].length).fill("")];
    onUpdate({ rows: newRows });
    triggerAutosave();
  };

  const addColumn = () => {
    const newRows = rowsRef.current.map(row => [...row, ""]);
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

  return (
    <div className={`group/table relative my-8 ${className || ''}`}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
        <table ref={tableRef} className="w-full border-collapse text-left table-fixed">
          <thead>
            <tr className="opacity-0 group-hover/table:opacity-100 transition-opacity bg-gray-50/50 dark:bg-gray-800/30">
              {rows[0].map((_, colIdx) => (
                <th key={colIdx} className="p-1 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 border-b">
                  <button onClick={() => deleteColumn(colIdx)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-md transition-all">
                    <Trash2 size={12} />
                  </button>
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row border-b border-gray-100 dark:border-gray-800 last:border-0">
                {row.map((cell, colIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${colIndex}`} // Chave baseada em posição para manter a célula
                    initialValue={cell}
                    onInput={(val) => handleCellInput(rowIndex, colIndex, val)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  />
                ))}
                <td className="w-10 p-0 relative border-none align-middle text-center">
                  <button onClick={() => deleteRow(rowIndex)} className="p-1.5 opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-md">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Botões Add Linha/Coluna omitidos para brevidade, mantê-los como no anterior */}
    </div>
  );
}

// COMPONENTE AUXILIAR PARA CÉLULA INDEPENDENTE
function TableCell({ initialValue, onInput, onKeyDown }: { 
  initialValue: string, 
  onInput: (val: string) => void, 
  onKeyDown: (e: React.KeyboardEvent) => void 
}) {
  const cellRef = useRef<HTMLTableCellElement>(null);

  // Injeta o valor apenas uma vez na montagem
  useEffect(() => {
    if (cellRef.current) {
      cellRef.current.innerHTML = initialValue;
    }
  }, []); // Efeito vazio = roda apenas no nascimento da célula

  return (
    <td 
      ref={cellRef}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      onInput={(e) => onInput(e.currentTarget.innerHTML)}
      className="p-3 border-r border-gray-100 dark:border-gray-800 last:border-0 min-w-[140px] outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500/20 focus:bg-orange-50/10 text-sm text-gray-700 dark:text-gray-300 transition-all"
    />
  );
}