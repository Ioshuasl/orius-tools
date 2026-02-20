import { Plus, Trash2 } from "lucide-react";
import type { Block } from "../types";

interface TableBlockProps {
  block: Block;
  onUpdate: (newData: any) => void;
  onEnterLastCell?: () => void;
}

export function TableBlock({ block, onUpdate, onEnterLastCell }: TableBlockProps) {
  const { rows } = block.data;

  // --- Funções de Manipulação da Tabela ---
  const addRow = () => {
    const newRow = new Array(rows[0].length).fill("");
    onUpdate({ rows: [...rows, newRow] });
  };

  const addColumn = () => {
    const newRows = rows.map((row: string[]) => [...row, ""]);
    onUpdate({ rows: newRows });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    onUpdate({ rows: newRows });
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_: any, i: number) => i !== index);
    onUpdate({ rows: newRows });
  };

  // --- Lógica de Navegação por Teclado ---
  const handleNavigation = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const totalRows = rows.length;
    const totalCols = rows[0].length;

    let targetRow = rowIndex;
    let targetCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        if (rowIndex > 0) {
          e.preventDefault();
          targetRow--;
        }
        break;
      case 'ArrowDown':
        if (rowIndex < totalRows - 1) {
          e.preventDefault();
          targetRow++;
        }
        break;
      case 'ArrowLeft':
        const selectionLeft = window.getSelection();
        // Só navega se o cursor estiver no início do texto da célula
        if (selectionLeft?.anchorOffset === 0 && colIndex > 0) {
          e.preventDefault();
          targetCol--;
        }
        break;
      case 'ArrowRight':
        const selectionRight = window.getSelection();
        const contentLen = (e.target as HTMLElement).innerText.length;
        // Só navega se o cursor estiver no final do texto da célula
        if (selectionRight?.anchorOffset === contentLen && colIndex < totalCols - 1) {
          e.preventDefault();
          targetCol++;
        }
        break;
      default:
        return;
    }

    // Se as coordenadas mudaram, move o foco para a célula alvo
    if (targetRow !== rowIndex || targetCol !== colIndex) {
      const targetElement = document.querySelector(
        `[data-row-index="${targetRow}"][data-col-index="${targetCol}"]`
      ) as HTMLElement;
      targetElement?.focus();
    }
  };

  return (
    <div className="my-6 group/table relative">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <table className="w-full border-collapse">
          <tbody>
            {rows.map((row: string[], rowIndex: number) => (
              <tr key={rowIndex} className="group/row border-b border-gray-100 dark:border-gray-700 last:border-0">
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border-r border-gray-100 dark:border-gray-700 last:border-0 p-0 min-w-[120px]">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-row-index={rowIndex}
                      data-col-index={colIndex}
                      onBlur={(e) => updateCell(rowIndex, colIndex, e.currentTarget.innerHTML)}
                      onKeyDown={(e) => {
                        // Implementa a navegação por setas
                        handleNavigation(e, rowIndex, colIndex);

                        if (e.key === 'Enter') {
                          if (e.shiftKey) return; // Permite quebra de linha com Shift+Enter
                          
                          e.preventDefault();
                          // Adiciona linha se for a última, ou apenas desce o foco
                          if (rowIndex === rows.length - 1) {
                            addRow();
                            setTimeout(() => {
                              const next = document.querySelector(`[data-row-index="${rowIndex + 1}"][data-col-index="${colIndex}"]`) as HTMLElement;
                              next?.focus();
                            }, 10);
                          } else {
                            const next = document.querySelector(`[data-row-index="${rowIndex + 1}"][data-col-index="${colIndex}"]`) as HTMLElement;
                            next?.focus();
                          }
                        }
                      }}
                      className={`w-full p-2.5 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 focus:bg-orange-50/30 dark:focus:bg-orange-500/5 transition-colors min-h-[40px] ${
                        rowIndex === 0 ? 'font-bold bg-gray-50/50 dark:bg-gray-900/50' : ''
                      }`}
                    />
                  </td>
                ))}
                {/* Botão de excluir linha */}
                <td className="w-8 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity bg-gray-50/30 dark:bg-gray-900/30">
                  <button 
                    onClick={() => removeRow(rowIndex)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    title="Remover linha"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Expansão */}
      <div className="flex gap-2 mt-2 opacity-0 group-hover/table:opacity-100 transition-opacity">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-tighter hover:bg-orange-500 hover:text-white transition-all shadow-sm"
        >
          <Plus size={12} /> Linha
        </button>
        <button
          onClick={addColumn}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-tighter hover:bg-orange-500 hover:text-white transition-all shadow-sm"
        >
          <Plus size={12} /> Coluna
        </button>
      </div>
    </div>
  );
}