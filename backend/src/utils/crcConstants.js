// Mapeamento de tipos de atos conforme a estrutura do XSD [cite: 1, 7, 13]
export const TIPO_ATO = {
    MOVIMENTONASCIMENTOTN: "Nascimento",
    MOVIMENTOCASAMENTOTC: "Casamento",
    MOVIMENTOOBITOTO: "Óbito",
    MOVIMENTOEMANCIPACAO: "Emancipação",
    MOVIMENTOINTERDICAO: "Interdição",
    MOVIMENTOAUSENCIA: "Ausência",
    MOVIMENTOUNIAOESTAVEL: "União Estável"
};

// Regimes de bens baseados nas enumerações do XSD [cite: 9, 12]
export const REGIME_BENS = {
    COMUNHAO_PARCIAL: "Comunhão Parcial",
    COMUNHAO_UNIVERSAL: "Comunhão Universal",
    PARTICIPACAO_FINAL_AQUESTOS: "Participação Final nos Aquestos",
    SEPARACAO_BENS: "Separação de Bens",
    SEPARACAO_LEGAL_BENS: "Separação Legal de Bens",
    OUTROS: "Outros",
    IGNORADO: "Ignorado"
};

// Regex para padrões de campo estritos definidos no XSD
export const PATTERNS = {
    CNS: /^[0-9]{6}$/,        // CNS deve ter exatamente 6 dígitos 
    MATRICULA: /^[0-9]{32}$/, // Matrícula deve ter exatamente 32 dígitos [cite: 1, 4]
    CPF: /^[0-9]{11}$/        // CPF formatado apenas com números [cite: 1, 14]
};