import axios from 'axios';
import type { ApiResponse, ApiResponseCensec, ApiResponseTabela, InstrucaoCorrecao } from '../types';

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