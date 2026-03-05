import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  getAllTabelasEmolumentos, 
  getTabelaEmolumentosById, 
  importTabelaEmolumentosXlsx 
} from '../services/api'; //
import type { TabelaEmolumentosHeader, TabelaEmolumentosFull } from '../types'; //

export function useTabelaEmolumentos() {
  const [tabelas, setTabelas] = useState<TabelaEmolumentosHeader[]>([]);
  const [selectedTabela, setSelectedTabela] = useState<TabelaEmolumentosFull | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para busca e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Carrega a lista inicial de tabelas
  const loadTabelas = async () => {
    setLoading(true);
    try {
      const data = await getAllTabelasEmolumentos();
      setTabelas(data);
    } catch (err) {
      toast.error("Erro ao carregar lista de tabelas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTabelas(); }, []);

  // Seleciona uma tabela para ver os registros
  const handleSelectTabela = async (id: number) => {
    setLoading(true);
    try {
      const data = await getTabelaEmolumentosById(id);
      setSelectedTabela(data);
      setSearchTerm('');
      setCurrentPage(1);
    } catch (err) {
      toast.error("Erro ao carregar detalhes da tabela.");
    } finally {
      setLoading(false);
    }
  };

  // Importa uma nova tabela
  const handleImport = async (file: File, nome: string) => {
    setLoading(true);
    const toastId = toast.loading("Importando e processando registros...");
    try {
      await importTabelaEmolumentosXlsx(file, nome);
      toast.success("Tabela importada com sucesso!", { id: toastId });
      setIsImporting(false);
      loadTabelas(); // Recarrega a lista
    } catch (err: any) {
      toast.error("Falha na importação.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedTabela) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return selectedTabela.registros.filter(item => 
      item.descricao_selo.toLowerCase().includes(lowerSearch) ||
      item.id_selo.toString().includes(lowerSearch) ||
      item.sistema.toLowerCase().includes(lowerSearch)
    );
  }, [selectedTabela, searchTerm]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return {
    tabelas,
    selectedTabela,
    setSelectedTabela,
    isImporting,
    setIsImporting,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalFiltered: filteredData.length,
    totalPages: Math.ceil(filteredData.length / itemsPerPage),
    handleSelectTabela,
    handleImport
  };
}