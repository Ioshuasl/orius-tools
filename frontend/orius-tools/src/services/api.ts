import axios from 'axios';
import type { ApiResponse, ApiResponseCensec, ApiResponseCommunity, ApiResponseTabela, CommunityPage, InstrucaoCorrecao } from '../types';

// Criação da instância do Axios
export const api = axios.create({
  // Tenta pegar do .env, se não existir usa localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 segundos (upload de arquivos pode demorar)
});

/**
 * Função específica para enviar os arquivos para comparação.
 * O endpoint espera Multipart Form Data.
 */
export const compararGuiasService = async (
  arquivoPdf: File, 
  arquivoCsv: File
): Promise<ApiResponse> => {
  
  const formData = new FormData();
  
  // Os nomes 'pdf' e 'csv' devem bater com o que o seu backend (Multer/Busboy) espera
  formData.append('pdf', arquivoPdf);
  formData.append('csv', arquivoCsv); 

  // Observação: Ao enviar FormData, o navegador define automaticamente 
  // o 'Content-Type': 'multipart/form-data' com o boundary correto.
  // Não precisamos forçar o header aqui na maioria dos casos, mas para garantir:
  const response = await api.post<ApiResponse>('/comparar/comparar-guias', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

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

  return response.data;
};

/**
 * Envia o XML e a lista de correções para gerar um novo XML corrigido
 */
export const corrigirCepService = async (
  arquivoXml: File,
  correcoes: InstrucaoCorrecao[]
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', arquivoXml); // Nome do campo deve ser 'file'
  
  // Envie como string simples em vez de Blob
  formData.append('correcoes', JSON.stringify(correcoes)); 

  const response = await api.post('/censec/corrigir-cep', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });

  return response.data;
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