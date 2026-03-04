import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'; // 'User' removido aqui
import { AtoCorrectionItem } from './AtoCorrectionItem';
import { AtoPartList } from './AtoPartList';
import type { AtoAgrupado } from '../../types';

interface AccordionProps {
    ato: AtoAgrupado;
    isOpen: boolean;
    onToggle: () => void;
    correcoes: Record<number, string>;
    onUpdateCorrecao: (linha: number, valor: string) => void;
    onGoToLine: (linha: number) => void;
}

export const AtoAccordion = ({ ato, isOpen, onToggle, correcoes, onUpdateCorrecao, onGoToLine }: AccordionProps) => (
    <div className={`rounded-3xl border-2 transition-all overflow-hidden bg-white dark:bg-gray-800 ${ato.sucesso ? 'border-green-100 dark:border-green-900/30' : 'border-red-100 dark:border-red-900/30 shadow-md'}`}>
        <button onClick={onToggle} className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-6">
                <div className={`p-3 rounded-2xl ${ato.sucesso ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {ato.sucesso ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div className="text-left">
                    <h3 className="font-black text-gray-900 dark:text-white text-base uppercase">{ato.nomeAto}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">LIVRO {ato.livro} • FOLHA {ato.folha}</p>
                </div>
            </div>
            {isOpen ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-300" />}
        </button>

        {isOpen && (
            <div className="px-8 pb-8 pt-4 border-t border-gray-50 dark:border-gray-700/50 animate-in slide-in-from-top-2 duration-300">
                <AtoPartList partes={ato.partes} />
                
                {ato.errosDoAto.length > 0 && (
                    <div className="space-y-4 mt-8">
                        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Ações de Correção</h4>
                        {ato.errosDoAto.map((erro, idx) => (
                            <AtoCorrectionItem 
                                key={idx} 
                                erro={erro} 
                                valor={correcoes[erro.linhaDoArquivo] || ''}
                                // Correção do Erro 7006: Definindo explicitamente o tipo 'string'
                                onChange={(val: string) => onUpdateCorrecao(erro.linhaDoArquivo, val)}
                                onGoToLine={() => onGoToLine(erro.linhaDoArquivo)}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
);