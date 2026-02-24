/**
 * CEP - Cartão de Assinaturas / Escrituras e Procurações
 * Constantes e Tabelas de Domínio baseadas na especificação cep.md
 */

// 3.1. Tipo do Ato (tipoAtoCep)
// Mapeamento de códigos para nomes amigáveis para a UI
export const TIPOS_ATO = {
    '1': 'Escritura',
    '2': 'Procuração',
    '3': 'Procuração para Fins Previdenciários',
    '5': 'Renúncia de Procuração',
    '6': 'Revogação de Procuração',
    '7': 'Subestabelecimento',
    '8': 'Ata Notarial',
    '9': 'Ata Notarial de Usucapião',
    '10': 'Procuração Privada' // Usado apenas em Referentes
};

// 3.2. Natureza Escritura (naturezaEscritura)
// Obrigatório se tipoAtoCep = 1
export const NATUREZAS_ESCRITURA = {
    '1': 'Acordo Extrajudicial',
    '4': 'Alienação Fiduciária',
    '6': 'Compra e Venda',
    '10': 'Confissão de Dívida / Dação',
    '15': 'Declaratória de União Estável',
    '20': 'Dissolução de União Estável',
    '22': 'Doação',
    '24': 'Hipoteca',
    '25': 'Incorporação',
    '35': 'Rerratificação',
    '46': 'Usufruto',
    '69': 'Inventário',
    '75': 'Conciliação',
    '76': 'Mediação',
    '77': 'Afetação',
    '78': 'Autocuratela',
    '79': 'Declaratória com diretivas de curatela'
};

// 3.3. Natureza Ata Notarial de Usucapião (naturezaAtaNotarialDeUsucapiao)
// Obrigatório se tipoAtoCep = 9
export const NATUREZAS_USUCAPIAO = {
    '1': 'Ordinária',
    '2': 'Extraordinária',
    '3': 'Especial Rural',
    '4': 'Especial Urbana',
    '5': 'Especial Familiar'
};

// 3.7. Natureza Litígio (naturezaLitigio)
// Obrigatório para Mediação/Conciliação
export const NATUREZAS_LITIGIO = {
    '1': 'Bancário',
    '2': 'Água',
    '4': 'Luz',
    '8': 'Família',
    '9': 'Locação'
};

// 3.8. Regime de Bens (regimeBens)
// Grafia exata exigida para XML
export const REGIMES_BENS_XML = [
    'Comunhão Parcial', 
    'Comunhão Universal', 
    'Particip. Final nos Aquestos', 
    'Separação Total', 
    'Separação Obrigatória'
];

// 3.4 e 3.9. Domínios de Texto Simples
export const TIPOS_DOCUMENTO = ['CPF', 'CNPJ', 'RNM', 'DESCONHECIDO'];

export const QUALIDADES_PARTE = [
    'OUTORGADO', 'OUTORGANTE', 'INTERVENIENTE', 
    'USUFRUTUÁRIO', 'REQUERENTE', 'REQUERIDO', 
    'CONCILIADOR', 'MEDIADOR'
];