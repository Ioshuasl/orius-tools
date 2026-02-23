/**
 * CESDI - Central de Escrituras de Separações, Divórcios e Inventários
 * Constantes e Tabelas de Domínio
 */

// 3.1. Tipo do Ato (tipoAtoCesdi)
export const TIPOS_ATO_CESDI = {
    '1': 'Separação',
    '2': 'Reconciliação',
    '3': 'Conversão de Separação em Divórcio',
    '4': 'Divórcio Direto',
    '5': 'Inventário',
    '6': 'Sobrepartilha',
    '7': 'Retificação',
    '8': 'Nomeação de Inventariante',
    '9': 'Partilha',
    '10': 'Inventário com menor ou incapaz',
    '11': 'Retificação de ato não notarial'
};

// 3.2. Qualidades da Parte por Tipo de Ato
// Mapeamento rigoroso para validação cruzada
export const QUALIDADES_POR_ATO = {
    '1': ['Separando', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '2': ['Reconciliando', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '3': ['Divorciando', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '4': ['Divorciando', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '5': ['Falecido', 'Viuvo', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente', 'Inventariante'],
    '6': ['Falecido', 'Viuvo', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente', 'Inventariante', 'Divorciando'],
    '7': ['Divorciando', 'Separando', 'Falecido', 'Viuvo', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '8': ['Falecido', 'Viuvo', 'Inventariante', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '9': ['Falecido', 'Viuvo', 'Herdeiro', 'Divorciando', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente'],
    '10': ['Falecido', 'Viuvo', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente', 'Inventariante'],
    '11': ['Divorciando', 'Separando', 'Falecido', 'Viuvo', 'Herdeiro', 'Advogado', 'CessionarioAdjudicatarios', 'Cedente', 'Interveniente', 'Anuente']
};

// 3.3. Responsável pelos Menores
export const RESPONSAVEL_MENORES = [
    { id: '1', label: 'Cônjuge 1' },
    { id: '2', label: 'Cônjuge 2' },
    { id: '3', label: 'Ambos Cônjuges' },
    { id: '4', label: 'Outros' },
    { id: '5', label: 'Sem Declaração' }
];

// 3.4. Regime de Bens (Mapeamento JSON <-> XML/TXT)
export const REGIMES_BENS_CESDI = {
    'ComunhaoParcial': 'Comunhão Parcial',
    'ComunhaoUniversal': 'Comunhão Universal',
    'ParticipacaoFinalNosAquestos': 'Particip. Final nos Aquestos',
    'SeparacaoTotal': 'Separação Total',
    'SeparacaoObrigatoria': 'Separação Obrigatória',
    'RegimeEspecificoAtribuidoEmPactoAntenupcial': 'Regime específico atribuído em Pacto Antenupcial'
};

// 2.4. Tipos de Documento Aceitos
export const TIPOS_DOCUMENTO_CESDI = [
    'CPF', 'CNPJ', 'OAB', 'RG', 'RNM', 'Outros', 'Desconhecido'
];

// 3.5 e 3.6. Pagamentos
export const FORMAS_PAGAMENTO = ['Cheque', 'Dinheiro', 'Nota Promissória', 'Permuta', 'Transferência', 'Outras'];
export const PRAZOS_PAGAMENTO = ['À Vista', 'A Prazo', 'Antecipado', 'Aditamento'];

// Requisitos de Mínimo de Partes para Validação
export const MINIMO_PARTES_POR_ATO = {
    '1': 3, // Separação (2 Cônjuges + 1 Advogado)
    '2': 3, // Reconciliação
    '3': 3, // Conversão
    '4': 3, // Divórcio
    '5': 2, // Inventário (1 Falecido + 1 Advogado)
    '6': 2, // Sobrepartilha
    '8': 2, // Nomeação de Inventariante
    '10': 2, // Inventário Incapaz
    'DEFAULT': 1
};