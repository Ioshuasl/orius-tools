import { X, History, Info } from 'lucide-react';

// Interface ajustada para receber o objeto acumulado do localStorage
interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historico: Record<number, { campo: string, valor: string, localizacao: string }>;
}

export function HistoryModal({ isOpen, onClose, historico }: HistoryModalProps) {
  if (!isOpen) return null;

  // Converte o objeto de histórico em um array para mapeamento na tabela
  const entradasHistorico = Object.entries(historico);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header Informativo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Histórico de Auditoria</h3>
              <p className="text-xs text-gray-500 font-medium">Todas as correções acumuladas neste arquivo</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Fechar"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Listagem das Correções Acumuladas */}
        <div className="max-h-[50vh] overflow-y-auto p-6">
          {entradasHistorico.length > 0 ? (
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="pb-3 px-2">Linha</th>
                  <th className="pb-3 px-2">Campo / Localização</th>
                  <th className="pb-3 px-2 text-right">Valor Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {entradasHistorico.map(([linha, dados], i) => (
                  <tr key={i} className="text-sm hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-2 font-mono text-xs text-orange-500 font-bold">
                      {linha}
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-gray-900 dark:text-white font-bold text-xs uppercase tracking-tight">
                        {dados.campo}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {dados.localizacao}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="inline-block px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg font-bold text-xs shadow-sm">
                        {dados.valor}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 inline-block rounded-full mb-3">
                <Info className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-500 text-sm font-medium">Nenhuma alteração registrada até o momento.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <button 
            onClick={onClose}
            className="w-full py-4 font-black text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}