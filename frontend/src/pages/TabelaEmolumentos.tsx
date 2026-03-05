import { TabelaHeader, TabelaStats, UploadSection, TableGrid, SearchBar, Pagination, TabelasListView } from '../components/TabelaEmolumentos';
import { useTabelaEmolumentos } from '../hooks/useTabelaEmolumentos';

export default function TabelaEmolumentos() {
  const {
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
    totalFiltered,
    totalPages,
    handleSelectTabela,
    handleImport,
  } = useTabelaEmolumentos();

  // 1. Tela de Importação
  if (isImporting) {
    return (
      <UploadSection
        loading={loading}
        onCancel={() => setIsImporting(false)}
        onImport={handleImport}
      />
    );
  }

  // 2. Tela de Detalhes (Visualização dos Registros da Tabela selecionada)
  if (selectedTabela) {
    return (
      <div className="pb-12 animate-in fade-in duration-300">
        <TabelaHeader
          title={selectedTabela.nome}
          registros={selectedTabela.registros} // Adicionado para corrigir o erro de falta de propriedade
          onBack={() => setSelectedTabela(null)}
        />
        <div className="p-4 sm:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
          <TabelaStats registros={selectedTabela.registros} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <div className="overflow-x-auto flex-1">
              <TableGrid data={paginatedData} searchTerm={searchTerm} />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalFiltered}
              itemsPerPage={50}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    );
  }

  // 3. Tela Inicial: Listagem de Tabelas Cadastradas
  return (
    <TabelasListView
      tabelas={tabelas}
      loading={loading}
      onSelect={handleSelectTabela}
      onStartImport={() => setIsImporting(true)}
    />
  );
}