import React, { useEffect, useState, useRef } from 'react';
import {
    Search, RefreshCcw, Briefcase, ChevronLeft,
    ChevronRight, Plus, Trash2, Edit, FileUp
} from 'lucide-react';
import { toast } from 'sonner';

import {
    listCbosService,
    importCboPdfService,
    deleteCboService
} from '../services/api';
import type { Cbo as CboType } from '../types';
import CboModal from '../components/Cbo/CboModal';

export default function CboPage() {
    // Estados de dados e paginação
    const [cbos, setCbos] = useState<CboType[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Estados de busca e Modal
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cboToEdit, setCboToEdit] = useState<CboType | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchCbos = async () => {
        setLoading(true);
        try {
            const response = await listCbosService(page, 15, searchTerm);
            if (response.success) {
                setCbos(response.data);
                setTotalPages(response.totalPages);
            }
        } catch (error: any) {
            toast.error('Erro ao sincronizar com o banco de dados');
        } finally {
            setLoading(false);
        }
    };

    // Debounce para busca
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCbos();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [page, searchTerm]);

    const handleAddNew = () => {
        setCboToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (cbo: CboType) => {
        setCboToEdit(cbo);
        setIsModalOpen(true);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        toast.promise(importCboPdfService(file), {
            loading: 'Processando PDF e atualizando base CBO...',
            success: (response) => {
                setPage(1);
                setSearchTerm('');
                fetchCbos();
                return `${response.totalInserido} profissões importadas!`;
            },
            error: 'Falha na importação do PDF governamental.',
            finally: () => { if (fileInputRef.current) fileInputRef.current.value = ''; }
        });
    };

    const handleDelete = (id: number) => {
        toast('Excluir profissão?', {
            description: 'Esta ação não pode ser desfeita no banco de dados.',
            action: {
                label: 'Excluir',
                onClick: async () => {
                    try {
                        const response = await deleteCboService(id);
                        if (response.success) {
                            toast.success('Registro removido.');
                            fetchCbos();
                        }
                    } catch (error) {
                        toast.error('Erro ao remover registro.');
                    }
                },
            },
        });
    };

    useEffect(() => {
        const pathAtual = window.location.pathname;
        const salvos = localStorage.getItem('orius_recent_modules');
        let lista: string[] = salvos ? JSON.parse(salvos) : [];
        lista = [pathAtual, ...lista.filter(p => p !== pathAtual)].slice(0, 5);
        localStorage.setItem('orius_recent_modules', JSON.stringify(lista));
    }, []);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="text-orange-500" />
                        CBO - Ocupações
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gerenciamento da Classificação Brasileira de Ocupações para o sistema Orius.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold text-sm shadow-sm"
                    >
                        <Plus size={18} className="text-orange-500" />
                        Novo Registro
                    </button>

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-semibold text-sm shadow-md shadow-orange-200 dark:shadow-none"
                    >
                        <FileUp size={18} />
                        Importar PDF
                    </button>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por código CBO ou título da profissão..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-gray-700 dark:text-gray-200 transition-all"
                    />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título Profissional</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCcw className="animate-spin text-orange-500" size={32} />
                                            <span className="text-sm text-gray-500 animate-pulse">Sincronizando base de dados...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : cbos.length > 0 ? (
                                cbos.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-orange-600 dark:text-orange-400 uppercase">
                                            {item.codigo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.titulo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.tipo.toLowerCase() === 'ocupação'
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                                    : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800'
                                                }`}>
                                                {item.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-gray-500 dark:text-gray-400 italic">
                                        Nenhuma ocupação encontrada para "{searchTerm}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Paginação Estilo Tabela de Emolumentos */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Página <span className="font-bold text-gray-900 dark:text-white">{page}</span> de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <CboModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCbos}
                cboToEdit={cboToEdit}
            />
        </div>
    );
}