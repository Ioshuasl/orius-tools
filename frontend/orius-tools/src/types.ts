// src/types.ts

export interface DetalheFundo {
  fundesp: number;
  funcomp: number;
  funemp: number;
  advogados: number;
  funproge: number;
  fundepeg: number;
}

export interface DetalheItem {
  campo: string;
  status: 'OK' | 'DIVERGENTE';
  valor_sistema: number;
  valor_arquivo: number;
  diferenca: number | null;
}

export interface RegistroAuditoria {
  pedido: string;
  status_registro: 'OK' | 'COM_DIVERGENCIA' | 'AUSENTE_NO_CSV' | 'AUSENTE_NO_SISTEMA' | 'NAO_ENCONTRADO_NO_SISTEMA_PDF';
  tipo_ato: string;
  codigo?: number; // Opcional pois pode não existir no PDF/CSV
  detalhes?: DetalheItem[];
  fundos?: DetalheFundo; // Detalhamento calculado
  valor_emol_arquivo?: number; // Para itens ausentes no sistema
}

export interface CabecalhoItem {
  campo: string;
  status: 'OK' | 'DIVERGENTE';
  valor_sistema: number;
  valor_arquivo: number;
  diferenca: number | null;
}

export interface EstatisticasGerais {
  total_atos_sistema: number;
  total_atos_arquivo: number;
  total_correto: number;
  total_com_divergencia: number;
  // Mantidos para compatibilidade com o componente de StatsCard se necessário
  ausentes_sistema?: number;
  ausentes_arquivo?: number;
}

export interface ApiResponse {
  success: boolean;
  data: {
    timestamp: string;
    estatisticas: EstatisticasGerais;
    resumo_comparativo: DetalheItem[];
    analise_registros: RegistroAuditoria[];
    arquivos_processados?: {
      pdf: string;
      csv: string;
    };
  };
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
  /** * No CESDI, este campo agora recebe o nome amigável do ato (Ex: "Retificação")
   * enviado pelo backend para melhorar a UI/UX.
   */
  tipoAtoCesdi?: string; 
  mensagemDeErro: string;
  tipoDeErro: string;
  /** * Lista de opções enviada pelo backend (ex: Qualidades permitidas para aquele ato)
   * para preencher automaticamente os Selects de correção.
   */
  opcoesAceitas?: string[];
  /** * Campo auxiliar controlado pelo estado do React para armazenar a edição do usuário
   */
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