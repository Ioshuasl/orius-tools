import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { CabecalhoItem } from '../types';
import { formatCurrency } from '../lib/utils';

interface HeaderTableProps {
  data: CabecalhoItem[];
}

export function HeaderTable({ data }: HeaderTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      <div className="bg-orange-50 dark:bg-orange-500/10 px-6 py-4 border-b border-orange-100 dark:border-orange-500/20">
        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
          Auditoria de Totais (Cabeçalho)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
            <tr>
              <th className="px-6 py-3">Campo</th>
              <th className="px-6 py-3">Valor Sistema</th>
              <th className="px-6 py-3">Valor Arquivo (PDF)</th>
              <th className="px-6 py-3">Diferença</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.map((item, index) => {
              const isDivergent = item.status !== 'OK';
              return (
                <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                  isDivergent ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                }`}>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{item.campo}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.campo.includes('Quantidade') ? item.valor_sistema : formatCurrency(item.valor_sistema)}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.campo.includes('Quantidade') ? item.valor_arquivo : formatCurrency(item.valor_arquivo)}</td>
                  <td className={`px-6 py-4 font-bold ${
                    isDivergent ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {item.diferenca ? formatCurrency(item.diferenca) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isDivergent ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400">
                        <AlertTriangle size={12} className="mr-1" /> Divergente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400">
                        <CheckCircle size={12} className="mr-1" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}