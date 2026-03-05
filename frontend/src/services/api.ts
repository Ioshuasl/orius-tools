import axios from 'axios';
import type { ApiResponse, ApiResponseCbo, ApiResponseCboImport, ApiResponseCboList, ApiResponseCensec, ApiResponseCommunity, ApiResponseIbgeSync, ApiResponseImportTabela, ApiResponseTabela, Cbo, CenprotValidationResponse, CommunityPage, CrcValidationResponse, IbgeDistrito, InstrucaoCorrecao, MinutaImportResponse, MinutaQualifyRequest, MinutaQualifyResponse, TabelaEmolumentosFull, TabelaEmolumentosHeader } from '../types';

// Criação da instância do Axios
export const api = axios.create({
  // Tenta pegar do .env, se não existir usa localhost
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 30 segundos (upload de arquivos pode demorar)
});

/**
 * Função específica para enviar os arquivos para comparação.
 * O endpoint espera Multipart Form Data.
 */
// src/services/api.ts
export const compararGuiasService = async (
  arquivoPdf: File, 
  arquivoCsv: File
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('pdf', arquivoPdf);
  formData.append('csv', arquivoCsv); 

  const response = await api.post<ApiResponse>('/comparar/comparar-guias', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log('Resposta da comparação:', response.data); // Log para depuração

  return response.data;
};

/**
 * Função para converter a Tabela de Emolumentos (Excel) em JSON
 */
export const converterTabelaService = async (arquivoXlsx: File): Promise<ApiResponseTabela> => {
  const formData = new FormData();
  
  // O backend espera o campo 'file' (conforme seu converterRoutes.js)
  formData.append('file', arquivoXlsx); 

  const response = await api.post<ApiResponseTabela>('/converter/tabela-emolumentos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('Resposta da conversão da tabela:', response.data); // Log para depuração

  return response.data;
};

/**
 * Envia o XML para validação das regras da CENSEC/CEP
 */
export const validarCepService = async (arquivoXml: File): Promise<ApiResponseCensec> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);

  const response = await api.post<ApiResponseCensec>('/censec/validar-cep', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log(response.data)

  return response.data;
};

/**
 * Envia o XML e a lista de correções para gerar um novo XML corrigido
 */
/**
 * Envia o XML e a lista de correções para gerar um novo XML corrigido
 * Agora retorna o Blob e informações de validação do header
 */
// api.ts - Altere a captura dos headers
export const corrigirCepService = async (
  arquivoXml: File,
  correcoes: InstrucaoCorrecao[]
): Promise<{ data: Blob; valid: boolean; errorCount: number }> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);
  formData.append('correcoes', JSON.stringify(correcoes)); 

  const response = await api.post('/censec/corrigir-cep', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });

  // Pegamos os valores brutos
  const successHeader = response.headers['x-validation-success'];
  const errorCount = parseInt(response.headers['x-validation-errors'] || '0', 10);

  // Lógica de segurança: é válido se o header diz true OU se o contador de erros é zero
  const isActuallyValid = successHeader === 'true' || successHeader === true || errorCount === 0;

  return {
    data: response.data,
    valid: isActuallyValid,
    errorCount: errorCount
  };
};

/**
 * Busca todas as publicações principais (parentId: null)
 */
export const getPublicationsService = async (params?: { search?: string; system?: string; tag?: string }): Promise<ApiResponseCommunity> => {
  const response = await api.get<ApiResponseCommunity>('/community/pages', { params });
  return response.data;
};

/**
 * Busca detalhes de uma página e suas subpáginas
 */
export const getPageDetailService = async (id: string): Promise<ApiResponseCommunity> => {
  const response = await api.get<ApiResponseCommunity>(`/community/pages/${id}`);
  console.log('Detalhes da página:', response.data); // Log para depuração
  return response.data;
};

/**
 * Cria uma nova página ou subpágina
 */
export const createPageService = async (pageData: Partial<CommunityPage>): Promise<ApiResponseCommunity> => {
  const response = await api.post<ApiResponseCommunity>('/community/pages', pageData);
  return response.data;
};

/**
 * Atualiza uma página existente (Conteúdo e Título)
 * Exportada exatamente como 'updatePage' para resolver o erro do editor
 */
export const updatePage = async (id: string, pageData: Partial<CommunityPage>): Promise<ApiResponseCommunity> => {
  const response = await api.put<ApiResponseCommunity>(`/community/pages/${id}`, pageData);
  return response.data;
};

/**
 * Upload de mídia para blocos de imagem/vídeo
 */
export const uploadMediaService = async (file: File): Promise<{ 
  success: boolean; 
  url: string; 
  filename: string; 
  mimetype: string 
}> => {
  const formData = new FormData();
  formData.append('media', file);
  
  const response = await api.post('/community/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  console.log('Resposta do upload de mídia:', response.data); // Log para depuração
  
  return response.data;
};

/**
 * Deleta uma página
 */
export const deletePageService = async (id: string): Promise<ApiResponseCommunity> => {
  const response = await api.delete<ApiResponseCommunity>(`/community/pages/${id}`);
  return response.data;
};

/**
 * Busca a trilha de navegação (ancestrais) de uma página específica
 * @param id ID da página atual
 * @returns Promise com o array de breadcrumbs ordenado da raiz até a página atual
 */
export const getBreadcrumbsService = (id: string) => {
  return api.get(`/community/pages/${id}/breadcrumbs`);
};

// Adicione estes novos serviços ao seu arquivo api.ts

/**
 * CESDI - Validação Inicial
 */
export const validarCesdiService = async (arquivoXml: File): Promise<ApiResponseCensec> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);

  const response = await api.post<ApiResponseCensec>('/censec/validar-cesdi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  console.log(response.data)
  return response.data;
};

/**
 * CESDI - Correção e Re-validação
 * Retorna o XML (Blob) e o status da nova validação via headers
 */
export const corrigirCesdiService = async (
  arquivoXml: File,
  correcoes: InstrucaoCorrecao[]
): Promise<{ data: Blob; success: boolean; errorCount: number }> => {
  
  const formData = new FormData();
  formData.append('file', arquivoXml);
  formData.append('correcoes', JSON.stringify(correcoes));

  const response = await api.post('/censec/corrigir-cesdi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob' // Necessário para baixar o arquivo
  });

  // Captura os headers que configuramos no CensecController
  const success = response.headers['x-validation-success'] === 'true';
  const errorCount = parseInt(response.headers['x-validation-errors'] || '0', 10);

  console.log(response.data)

  return {
    data: response.data,
    success,
    errorCount
  };
};

/**
 * RCTO - Validação Inicial de XML de Testamentos
 */
export const validarRctoService = async (arquivoXml: File): Promise<ApiResponseCensec> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);

  const response = await api.post<ApiResponseCensec>('/censec/validar-rcto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

/**
 * RCTO - Envia correções e retorna o novo XML (Blob) com status de re-validação
 */
export const corrigirRctoService = async (
  arquivoXml: File,
  correcoes: InstrucaoCorrecao[]
): Promise<{ data: Blob; success: boolean; errorCount: number }> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);
  formData.append('correcoes', JSON.stringify(correcoes));

  const response = await api.post('/censec/corrigir-rcto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });

  // Captura de metadados de validação via headers
  const successHeader = response.headers['x-validation-success'];
  const errorCount = parseInt(response.headers['x-validation-errors'] || '0', 10);

  // Consideramos sucesso se o backend confirmar ou se o contador de erros for zerado
  const isActuallyValid = successHeader === 'true' || successHeader === true || errorCount === 0;

  return {
    data: response.data,
    success: isActuallyValid,
    errorCount: errorCount
  };
};

/**
 * DOI - Validação Inicial de Lote JSON
 */
export const validarDoiService = async (arquivoJson: File): Promise<ApiResponseCensec> => {
  const formData = new FormData();
  formData.append('file', arquivoJson);

  const response = await api.post<ApiResponseCensec>('/doi/validar-doi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log(response.data)

  return response.data;
};

/**
 * DOI - Correção e Higienização do JSON Legado
 */
export const corrigirDoiService = async (
  arquivoJson: File,
  correcoes: InstrucaoCorrecao[]
): Promise<{ data: Blob; success: boolean; errorCount: number }> => {
  const formData = new FormData();
  formData.append('file', arquivoJson);
  formData.append('correcoes', JSON.stringify(correcoes));

  const response = await api.post('/doi/corrigir-doi', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });

  const success = response.headers['x-validation-success'] === 'true';
  const errorCount = parseInt(response.headers['x-validation-errors'] || '0', 10);

  return {
    data: response.data,
    success,
    errorCount
  };
};

/**
 * Realiza a validação de arquivos XML CENPROT em lote (até 4 arquivos)
 * @param files Lista de arquivos (Apontamento, Cancelado, Protestado, Outros)
 */
export const validarXmlCenprotLote = async (files: File[]): Promise<CenprotValidationResponse> => {
  const formData = new FormData();
  
  // Adiciona todos os arquivos ao campo 'files' esperado pelo backend
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<CenprotValidationResponse>('/cenprot/validar-lote', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('Resposta da validação CENPROT:', response.data); // Log para depuração

  return response.data;
};

/**
 * Importa uma minuta RTF e recebe o HTML processado com spans interativos.
 * @param arquivoRtf Arquivo original vindo do sistema Delphi.
 */
export const importMinutaService = async (arquivoRtf: File): Promise<MinutaImportResponse> => {
  const formData = new FormData();
  formData.append('minuta', arquivoRtf);

  const response = await api.post<MinutaImportResponse>('/minutas/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log('Resposta da importação de minuta:', response.data); // Log para depuração

  return response.data;
};

/**
 * Envia o conteúdo do editor (HTML) e os dados do formulário para gerar o documento final.
 * @param payload Objeto contendo o HTML e o mapeamento das variáveis.
 */
export const qualifyMinutaService = async (
  payload: MinutaQualifyRequest
): Promise<MinutaQualifyResponse> => {
  const response = await api.post<MinutaQualifyResponse>('/minutas/qualify', payload);
  return response.data;
};

/**
 * Faz o upload e importação do PDF da CBO
 * @param file Arquivo PDF original do governo
 */
export const importCboPdfService = async (file: File): Promise<ApiResponseCboImport> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponseCboImport>('/cbo/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

/**
 * Lista as ocupações com paginação
 */
export const listCbosService = async (page = 1, limit = 20, search = ''): Promise<ApiResponseCboList> => {
  const response = await api.get<ApiResponseCboList>('/cbo', {
    params: { page, limit, search } // Adicionado search aqui
  });
  return response.data;
};

/**
 * Busca uma ocupação por ID
 */
export const getCboByIdService = async (id: number): Promise<ApiResponseCbo> => {
  const response = await api.get<ApiResponseCbo>(`/cbo/${id}`);
  return response.data;
};

/**
 * Cria um novo registro de CBO manualmente
 */
export const createCboService = async (data: Partial<Cbo>): Promise<ApiResponseCbo> => {
  const response = await api.post<ApiResponseCbo>('/cbo', data);
  return response.data;
};

/**
 * Atualiza um registro de CBO
 */
export const updateCboService = async (id: number, data: Partial<Cbo>): Promise<ApiResponseCbo> => {
  const response = await api.put<ApiResponseCbo>(`/cbo/${id}`, data);
  return response.data;
};

/**
 * Deleta um registro de CBO
 */
export const deleteCboService = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/cbo/${id}`);
  return response.data;
};

/**
 * CRC - Envia o arquivo XML para validação contra o XSD e Regras de Negócio.
 */
export const validarCrcService = async (arquivoXml: File): Promise<CrcValidationResponse> => {
  const formData = new FormData();
  // O backend (multer) espera o campo 'file' conforme definido no seu crcRoutes.js
  formData.append('file', arquivoXml);

  const response = await api.post<CrcValidationResponse>('/crc/validar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log('Resposta da validação CRC:', response.data); // Log para depuração

  return response.data;
};

/**
 * CRC - Envia o XML e as instruções de correção para gerar um novo arquivo corrigido.
 * Segue o padrão de retorno do Censec/DOI com headers de validação.
 */
export const corrigirCrcService = async (
  arquivoXml: File,
  correcoes: InstrucaoCorrecao[]
): Promise<{ data: Blob; success: boolean; errorCount: number }> => {
  const formData = new FormData();
  formData.append('file', arquivoXml);
  formData.append('correcoes', JSON.stringify(correcoes));

  const response = await api.post('/crc/corrigir', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob', // Necessário para processar o download do XML
  });

  // Captura metadados de validação injetados pelo backend nos headers
  const successHeader = response.headers['x-validation-success'];
  const errorCount = parseInt(response.headers['x-validation-errors'] || '0', 10);

  return {
    data: response.data,
    success: successHeader === 'true' || errorCount === 0,
    errorCount: errorCount
  };
};

/**
 * IBGE - Lista distritos filtrados do arquivo local ibge.json
 * @param params filtros opcionais (uf, busca, apenasComarcas)
 */
export const getIbgeDistritosService = async (params?: { 
  uf?: string; 
  busca?: string; 
  apenasComarcas?: string 
}): Promise<IbgeDistrito[]> => {
  const response = await api.get<IbgeDistrito[]>('/ibge/distritos', { params });
  return response.data;
};

/**
 * IBGE - Força a atualização do arquivo ibge.json baixando dados novos do IBGE
 */
export const syncIbgeService = async (): Promise<ApiResponseIbgeSync> => {
  const response = await api.post<ApiResponseIbgeSync>('/ibge/sincronizar');
  return response.data;
};

/**
 * TABELA DE EMOLUMENTOS - Lista todas as tabelas (cabeçalhos) cadastradas.
 * Endpoint: GET /tabela-emolumentos
 */
export const getAllTabelasEmolumentos = async (): Promise<TabelaEmolumentosHeader[]> => {
  const response = await api.get<TabelaEmolumentosHeader[]>('/tabela-emolumentos');
  return response.data;
};

/**
 * TABELA DE EMOLUMENTOS - Busca os detalhes e os 1500+ registros de uma tabela específica.
 * Endpoint: GET /tabela-emolumentos/:id
 */
export const getTabelaEmolumentosById = async (id: number): Promise<TabelaEmolumentosFull> => {
  const response = await api.get<TabelaEmolumentosFull>(`/tabela-emolumentos/${id}`);
  return response.data;
};

/**
 * TABELA DE EMOLUMENTOS - Importa um novo arquivo Excel e cadastra no banco de dados.
 * @param arquivoXlsx O arquivo .xlsx do TJGO.
 * @param nomeTabela Nome personalizado definido pelo usuário.
 * Endpoint: POST /tabela-emolumentos/import
 */
export const importTabelaEmolumentosXlsx = async (
  arquivoXlsx: File, 
  nomeTabela: string
): Promise<ApiResponseImportTabela> => {
  const formData = new FormData();
  
  // O backend espera o campo 'file' (pelo multer) e 'nomeTabela' (pelo req.body)
  formData.append('file', arquivoXlsx); 
  formData.append('nomeTabela', nomeTabela);

  const response = await api.post<ApiResponseImportTabela>('/tabela-emolumentos/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('✅ Tabela importada e cadastrada:', response.data);
  return response.data;
};