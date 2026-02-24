import axios from 'axios';
import type { ApiResponse, ApiResponseCensec, ApiResponseCommunity, ApiResponseTabela, CommunityPage, InstrucaoCorrecao } from '../types';

// Criação da instância do Axios
export const api = axios.create({
  // Tenta pegar do .env, se não existir usa localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.1.140:3000/api',
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
export const uploadMediaService = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('media', file);
  const response = await api.post('/community/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
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