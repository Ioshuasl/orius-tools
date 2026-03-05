import type { TabelaEmolumentosItem } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface TableGridProps {
  data: TabelaEmolumentosItem[];
  searchTerm: string;
}

export function TableGrid({ data, searchTerm }: TableGridProps) {
  // Helper para formatar a visualização dos selos combinados
  const formatSeloCombinado = (texto: string) => {
    return texto.replace(/\n/g, ', ');
  };

  return (
    <table className="w-full text-xs text-left">
      <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium sticky top-0 shadow-sm z-0">
        <tr>
          <th className="px-4 py-2.5 w-16">Cód</th>
          <th className="px-4 py-2.5 w-24">Agrupador</th>
          <th className="px-4 py-2.5 min-w-[250px] xl:min-w-[350px]">Descrição do Selo</th>
          <th className="px-4 py-2.5 min-w-[200px]">Sistema & Regras</th>
          <th className="px-4 py-2.5 text-right w-24">Emolumentos</th>
          <th className="px-4 py-2.5 text-right w-24">Taxa Jud.</th>
          <th className="px-4 py-2.5 text-right w-24">Faixa Cot.</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {data.map((item, index) => (
          <tr key={`${item.id_selo}-${index}`} className="hover:bg-orange-50/30 dark:hover:bg-gray-700/30 transition-colors group">
            <td className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
              {item.id_selo}
            </td>

            <td className="px-4 py-2">
              {item.id_selo_combinado ? (
                <div
                  className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help truncate max-w-[70px]"
                  title={formatSeloCombinado(item.id_selo_combinado)}
                >
                  {formatSeloCombinado(item.id_selo_combinado)}
                </div>
              ) : (
                <span className="text-gray-300 dark:text-gray-600">-</span>
              )}
            </td>

            <td className="px-4 py-2 text-gray-600 dark:text-gray-400 leading-snug whitespace-normal">
              {item.descricao_selo}
            </td>

            <td className="px-4 py-2 whitespace-normal">
              <div className="flex flex-wrap gap-1">
                <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-100 dark:border-orange-500/20">
                  {item.sistema}
                </span>

                {item.ato && (
                  <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-100 dark:border-blue-500/20" title="Ato">
                    {item.ato}
                  </span>
                )}
                
                {item.condicao_pagamento && (
                  <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-purple-100 dark:border-purple-500/20" title="Condição">
                    {item.condicao_pagamento.replace(/_/g, ' ')}
                  </span>
                )}

                {item.condicao_especial && item.condicao_especial !== 'PADRAO' && (
                  <span className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-green-100 dark:border-green-500/20">
                    {item.condicao_especial.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </td>

            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(item.valor_emolumento)}
            </td>
            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
              {formatCurrency(item.valor_taxa_judiciaria)}
            </td>
            <td className="px-4 py-2 text-right text-gray-500 dark:text-gray-500">
              {item.faixa_cotacao ? formatCurrency(item.faixa_cotacao) : '-'}
            </td>
          </tr>
        ))}

        {data.length === 0 && (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
              Nenhum registro encontrado para "{searchTerm}".
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}