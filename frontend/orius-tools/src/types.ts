// src/types.ts

export interface DetalheItem {
  campo: string;
  status: 'OK' | 'DIVERGENTE';
  valor_sistema: number;
  valor_arquivo: number;
  diferenca: number | null;
}

export interface RegistroAuditoria {
  pedido: string;
  codigo: number;
  tipo_ato: string;
  status_registro: 'OK' | 'COM_DIVERGENCIA' | 'AUSENTE_NO_SISTEMA';
  detalhes: DetalheItem[];
}

export interface CabecalhoItem {
  campo: string;
  status: 'OK' | 'DIVERGENTE';
  valor_sistema: number;
  valor_arquivo: number;
  diferenca: number | null;
}

export interface EstatisticasGerais {
  total_analisado: number;
  total_correto: number;
  total_com_divergencia: number;
  ausentes_sistema: number;
  ausentes_arquivo: number;
}

export interface ApiResponse {
  success: boolean;
  arquivos_processados: {
    pdf: string;
    csv: string;
  };
  estatisticas_gerais: EstatisticasGerais;
  auditoria_cabecalho: CabecalhoItem[];
  auditoria_registros: RegistroAuditoria[];
  data_analise: string;
}

// --- Tabela de Emolumentos ---

export interface TabelaEmolumentosItem {
  id_selo: number;
  descricao_selo: string;
  faixa_cotacao: number | null;
  id_selo_combinado: string | null;
  valor_emolumento: number;
  valor_taxa_judiciaria: number;
  sistema: string;
  ato?: string;
  condicao_pagamento?: string;
  condicao_especial?: string;
  faixa_valor_inicio?: number;
  faixa_valor_fim?: number | null;
}

export interface ApiResponseTabela {
  success: boolean;
  origem: string;
  total_registros: number;
  data: TabelaEmolumentosItem[];
}

// --- CENSEC / CEP ---

export interface InstrucaoCorrecao {
  linhaDoArquivo: number;
  campo: string;
  novoValor: string;
}

export interface ErroCensec {
  linhaDoArquivo: number;
  localizacao: string;
  nomeDaParte: string | null;
  mensagemDeErro: string;
  tipoDeErro: string;
  opcoesAceitas?: string[];
  // Campo auxiliar para o frontend gerenciar a correção manual
  valorCorrigido?: string; 
}

export interface ApiResponseCensec {
  success: boolean;
  total_atos_agrupados: number;
  total_erros: number;
  erros: ErroCensec[];
}

// src/types.ts

export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'image' | 'video' | 'code' | 'table' | 'page' | 'bullet_list' | 'numbered_list' | 'quote' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  data: any; // Depende do tipo de bloco (ex: { text: "..." } ou { url: "..." })
}

export interface BreadcrumbItem {
  id: string;
  title: string;
}

export interface CommunityPage {
  id: string;
  title: string;
  system: string | null;
  tags: string[];
  content: Block[];
  parentId: string | null;
  breadcrumbs?: BreadcrumbItem[];
  subPages?: CommunityPage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponseCommunity {
  success: boolean;
  total?: number;
  data: CommunityPage | CommunityPage[];
  message?: string;
}