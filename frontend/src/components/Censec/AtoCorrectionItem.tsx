import { ExternalLink, Info } from 'lucide-react';
import type { ErroCensec } from '../../types';

interface AtoCorrectionItemProps {
    erro: ErroCensec;
    valor: string;
    onChange: (val: string) => void;
    onGoToLine: () => void;
}

export const AtoCorrectionItem = ({ erro, valor, onChange, onGoToLine }: AtoCorrectionItemProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 bg-red-50/30 dark:bg-red-900/5 rounded-[2rem] border border-red-100 dark:border-red-900/20">
            {/* Lado Esquerdo: Descrição do Erro */}
            <div className="md:col-span-7">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">
                    {erro.mensagemDeErro}
                </p>
                <div className="flex items-center gap-3 mt-2">
                    <button 
                        onClick={onGoToLine} 
                        className="text-[9px] font-black text-gray-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                    >
                        LINHA {erro.linhaDoArquivo} <ExternalLink size={10} />
                    </button>
                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                        {erro.tipoDeErro}
                    </span>
                </div>
            </div>

            {/* Lado Direito: Interface de Correção */}
            <div className="md:col-span-5">
                {erro.tipoDeErro === 'Regra de Negócio' ? (
                    /* Caso 1: Instrução de Sistema (Sem Input) */
                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-[9px] uppercase tracking-wider">
                            <Info size={12} />
                            <span>Instrução de Sistema</span>
                        </div>
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 leading-snug">
                            Verifique dentro do ato no sistema se {erro.mensagemDeErro.split(':').pop()?.trim().replace('.', '')} estão cadastrados corretamente.
                        </p>
                    </div>
                ) : erro.opcoesAceitas && erro.opcoesAceitas.length > 0 ? (
                    /* Caso 2: Opções Aceitas (Select) */
                    <select 
                        className="w-full text-xs font-bold p-3 rounded-xl border border-red-200 dark:border-red-900/30 focus:border-orange-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                        value={valor}
                        onChange={(e) => onChange(e.target.value)}
                    >
                        <option value="">Selecione a opção...</option>
                        {erro.opcoesAceitas.map((opt, i) => (
                            <option key={i} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ) : (
                    /* Caso 3: Correção Livre (Input) */
                    <input 
                        type="text" 
                        placeholder="Valor correto..."
                        className="w-full text-xs font-bold p-3 rounded-xl border border-red-200 dark:border-red-900/30 focus:border-orange-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all"
                        value={valor}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            </div>
        </div>
    );
};