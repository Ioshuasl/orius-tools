/**
 * CESDI - Helpers de Validação e Utilitários
 */

export const isCpfValido = (cpf) => {
    if (!cpf) return false;
    const cleanCpf = cpf.replace(/[^\d]+/g, '');
    if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cleanCpf.substring(10, 11));
};

export const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

/**
 * Retorna contagem de qualidades específicas em um ato (Rigoroso: Case & Accent sensitive)
 */
export const countQualidades = (partes, qualidadeAlvo) => {
    return partes.filter(p => p.qualidade === qualidadeAlvo).length;
};

/**
 * Valida se a composição de partes atende às regras de negócio (b a j)
 */
export const validarComposicaoAto = (codAto, partes, counts) => {
    const { advogados, separandos, reconciliandos, divorciandos, falecidos, inventariantes } = counts;
    const total = partes.length;

    switch (codAto) {
        case '1': // Separação
            return total >= 3 && advogados >= 1 && separandos >= 2;
        case '2': // Reconciliação
            return total >= 3 && advogados >= 1 && reconciliandos >= 2;
        case '3': 
        case '4': // Divórcio
            return total >= 3 && advogados >= 1 && divorciandos >= 2;
        case '5': // Inventário
            return total >= 2 && advogados >= 1 && falecidos >= 1;
        case '6': // Sobrepartilha
            return total >= 2 && advogados >= 1 && (falecidos >= 1 || divorciandos >= 1);
        case '7': // Retificação
            return total >= 1;
        case '8': // Nomeação de Inventariante (Regra i)
            return total >= 2 && inventariantes >= 1 && falecidos >= 1;
        case '9': // Partilha
            return total >= 2 && advogados >= 1 && (falecidos >= 1 || divorciandos >= 1);
        default:
            return true;
    }
};