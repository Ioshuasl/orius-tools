/**
 * DOI - Declaração sobre Operações Imobiliárias
 * Tabelas de Domínio conforme manual da Receita Federal (doi.md)
 */

export const TIPO_DECLARACAO = {
    '0': 'Original',
    '1': 'Retificadora',
    '3': 'Canceladora'
};

export const TIPO_SERVICO = {
    '1': 'Notarial',
    '2': 'Registro de Imóveis',
    '3': 'Registro de Títulos e Documentos'
};

export const TIPO_ATO = {
    '1': 'Escritura',
    '2': 'Procuração',
    '3': 'Averbação',
    '4': 'Registro',
    '5': 'Registros para fins de publicidade',
    '6': 'Registro para fins de conservação'
};

export const TIPO_LIVRO = {
    '1': 'Lv.2-Registro Geral (matrícula)',
    '2': 'Transcrição das Transmissões'
};

export const NATUREZA_TITULO = {
    '1': 'Instrumento particular com força de escritura pública',
    '2': 'Escritura Pública',
    '3': 'Título Judicial',
    '4': 'Contratos ou termos administrativos',
    '5': 'Atos autênticos de países estrangeiros'
};

export const TIPO_OPERACAO_IMOBILIARIA = {
    '11': 'Compra e Venda',
    '13': 'Permuta',
    '55': 'Doação adiantamento legítima',
    '67': 'Doação',
    '69': 'Inventário'
    // Outros códigos de 11 a 74 podem ser adicionados conforme a fonte
};

export const FORMA_PAGAMENTO = {
    '5': 'Quitado à vista',
    '10': 'Quitado a prazo',
    '11': 'Quitado sem informação da forma de pagamento',
    '7': 'A prazo',
    '9': 'Não se aplica'
};

export const TIPO_PARTE_TRANSACIONADA = {
    '1': '% (Percentual)',
    '2': 'ha/m² (Área)'
};

export const REGIME_BENS_DOI = {
    '1': 'Separação de Bens',
    '2': 'Comunhão Parcial de Bens',
    '3': 'Comunhão Universal de Bens',
    '4': 'Participação Final nos Aquestos'
};

export const TIPO_IMOVEL_DOI = {
    '15': 'Loja',
    '65': 'Apartamento',
    '67': 'Casa',
    '69': 'Fazenda/Sítio',
    '71': 'Terreno'
};