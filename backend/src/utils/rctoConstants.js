/**
 * RCTO - Registro Central de Testamentos Online
 * Constantes e Tabelas de Domínio baseadas na especificação rcto.md
 */

// 3.1. Tabela de Domínio 1: tipoTestamento
// Define o tipo do testamento lavrado no ato.
export const TIPOS_TESTAMENTO_RCTO = {
    '1': 'Aditamento',
    '2': 'Cerrado',
    '3': 'Revogação',
    '4': 'Testamento',
    '5': 'Testamento com Revogação',
    '6': 'Testamento sem Conteúdo Patrimonial'
};

// 3.2. Tabela de Domínio 2: tipoDocumento
// Define os tipos de documentos de identificação aceitos para o testador.
export const TIPOS_DOCUMENTO_RCTO = {
    'RG': 'Registro Geral',
    'RNE': 'Registro Nacional de Estrangeiros',
    'OUTROS': 'Outros tipos (requer preenchimento de documentoComplemento)'
};

// 2. Regras de Obrigatoriedade Condicional (Revogação)
// Campos que se tornam obrigatórios quando tipoTestamento é igual a '3'.
export const CAMPOS_OBRIGATORIOS_REVOGACAO = [
    'revogacaoCartorioCns',
    'revogacaoDataTestamento',
    'revogacaoLivro',
    'revogacaoFolha'
];

// Requisitos de Formato e Unicidade
// Utilizado para validação de tipos de dados e chaves compostas.
export const REGRAS_FORMATO = {
    CPF_LENGTH: 11,
    LIVRO_MAX_LENGTH: 8,
    FOLHA_MAX_LENGTH: 4,
    NOME_MAX_LENGTH: 150
};