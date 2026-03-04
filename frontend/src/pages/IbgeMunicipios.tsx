import { useEffect, useState } from 'react';
import { 
    MapPin, Search, RefreshCcw, Globe, 
    CheckCircle2, AlertCircle, Filter, Download, Copy
} from 'lucide-react';
import { toast } from 'sonner';

import { 
    getIbgeDistritosService, 
    syncIbgeService 
} from '../services/api';
import type { IbgeDistrito } from '../types';

export default function IbgeMunicipios() {
    // Estados de dados e interface
    const [distritos, setDistritos] = useState<IbgeDistrito[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Estados de filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [ufFilter, setUfFilter] = useState('GO');
    const [onlyComarcas, setOnlyComarcas] = useState(false);

    const fetchDistritos = async () => {
        setLoading(true);
        try {
            const data = await getIbgeDistritosService({
                busca: searchTerm,
                uf: ufFilter,
                apenasComarcas: onlyComarcas ? 'true' : undefined
            });
            setDistritos(data);
        } catch (error: any) {
            toast.error('Erro ao carregar dados do IBGE');
        } finally {
            setLoading(false);
        }
    };

    // Debounce para busca e filtros
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDistritos();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, ufFilter, onlyComarcas]);

    const handleSync = async () => {
        setSyncing(true);
        toast.promise(syncIbgeService(), {
            loading: 'Sincronizando com base de dados do IBGE...',
            success: (res) => {
                fetchDistritos();
                return `Sucesso! ${res.info.count} registros atualizados.`;
            },
            error: 'Falha na comunicação com o IBGE.',
            finally: () => setSyncing(false)
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Código IBGE ${text} copiado!`);
    };

    // Registro de módulo recente
    useEffect(() => {
        const pathAtual = window.location.pathname;
        const salvos = localStorage.getItem('orius_recent_modules');
        let lista: string[] = salvos ? JSON.parse(salvos) : [];
        lista = [pathAtual, ...lista.filter(p => p !== pathAtual)].slice(0, 5);
        localStorage.setItem('orius_recent_modules', JSON.stringify(lista));
    }, []);

    const listaUFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="text-orange-500" />
                        IBGE - Municípios e Distritos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Consulta de códigos IBGE e identificação de comarcas para o sistema Orius.
                    </p>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold text-sm shadow-sm disabled:opacity-50"
                >
                    <Download size={18} className={syncing ? "animate-bounce text-orange-500" : "text-orange-500"} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar IBGE'}
                </button>
            </div>

            {/* Filtros e Busca */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar distrito ou município..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-700 dark:text-gray-200 transition-all"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={ufFilter}
                        onChange={(e) => setUfFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-700 dark:text-gray-200 transition-all appearance-none"
                    >
                        <option value="">Brasil (Todas as UFs)</option>
                        {listaUFs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => setOnlyComarcas(!onlyComarcas)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium text-sm ${
                        onlyComarcas 
                        ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700'
                    }`}
                >
                    <Globe size={18} />
                    Apenas Comarcas
                </button>
            </div>

            {/* Tabela Revertida */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código IBGE</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distrito</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Município Sede</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">UF</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Tipo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCcw className="animate-spin text-orange-500" size={32} />
                                            <span className="text-sm text-gray-500 animate-pulse">Sincronizando com base local...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : distritos.length > 0 ? (
                                distritos.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => copyToClipboard(item.municipioId.toString())}
                                                className="flex items-center gap-2 font-mono text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 px-2 py-1 rounded transition-all"
                                                title="Clique para copiar o código"
                                            >
                                                {item.municipioId}
                                                <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 uppercase text-sm">
                                            {item.distritoNome}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {item.municipioNome}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 dark:text-gray-300">
                                                {item.ufSigla}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {item.isComarca ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 uppercase tracking-tighter">
                                                        <AlertCircle size={10} />
                                                        Distrito/Comarca
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 uppercase tracking-tighter">
                                                        <CheckCircle2 size={10} />
                                                        Município Sede
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400 italic">
                                        Nenhuma localidade encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest px-2">
                <span>Fonte: IBGE / Localidades</span>
                <span>Limite: 500 registros por consulta</span>
            </div>
        </div>
    );
}