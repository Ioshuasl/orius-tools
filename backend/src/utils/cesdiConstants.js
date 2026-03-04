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

// Qualidades padronizadas conforme solicitado (Caixa Alta e Acentuação)
const Q = {
    ADVOGADO: 'ADVOGADO(A)',
    SEPARANDO: 'SEPARANDO(A)',
    RECONCILIANDO: 'RECONCILIANDO(A)',
    DIVORCIANDO: 'DIVORCIANDO(A)',
    FALECIDO: 'FALECIDO(A)',
    VIUVO: 'VIUVO(A)',
    HERDEIRO: 'HERDEIRO(A)',
    INVENTARIANTE: 'INVENTARIANTE',
    CESSIONARIO: 'CESSIONÁRIO/ADJUDICATÁRIOS',
    CEDENTE: 'CEDENTE',
    INTERVENIENTE: 'INTERVENIENTE',
    ANUENTE: 'ANUENTE'
};

export const QUALIDADES_POR_ATO = {
    '1': [Q.SEPARANDO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '2': [Q.RECONCILIANDO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '3': [Q.DIVORCIANDO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '4': [Q.DIVORCIANDO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '5': [Q.FALECIDO, Q.ADVOGADO, Q.VIUVO, Q.HERDEIRO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE, Q.INVENTARIANTE],
    '6': [Q.FALECIDO, Q.ADVOGADO, Q.DIVORCIANDO, Q.VIUVO, Q.HERDEIRO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE, Q.INVENTARIANTE],
    '7': [Q.DIVORCIANDO, Q.SEPARANDO, Q.FALECIDO, Q.VIUVO, Q.HERDEIRO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    // ATO 8: Prioridade para INVENTARIANTE e FALECIDO(A)
    '8': [Q.INVENTARIANTE, Q.FALECIDO, Q.VIUVO, Q.HERDEIRO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '9': [Q.FALECIDO, Q.ADVOGADO, Q.DIVORCIANDO, Q.VIUVO, Q.HERDEIRO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE],
    '10': [Q.FALECIDO, Q.ADVOGADO, Q.VIUVO, Q.HERDEIRO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE, Q.INVENTARIANTE],
    '11': [Q.DIVORCIANDO, Q.SEPARANDO, Q.FALECIDO, Q.VIUVO, Q.HERDEIRO, Q.ADVOGADO, Q.CESSIONARIO, Q.CEDENTE, Q.INTERVENIENTE, Q.ANUENTE]
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