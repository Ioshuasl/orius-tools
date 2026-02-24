// src/utils/cepHelper.js
import * as CONSTANTES from './cepConstants.js';

/**
 * Validação Matemática de CPF
 */
export const isCpfValido = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
};

/**
 * 1. Validação de Natureza Obrigatória
 * Regra: naturezaEscritura é obrigatória se tipoAtoCep = 1
 */
export const validarNaturezaObrigatoria = (ato) => {
    if (ato.tipoAtoCep === '1' && !ato.naturezaEscritura) {
        return {
            mensagem: "Tag 'NaturezaEscritura' é obrigatória para Escrituras.",
            opcoes: Object.entries(CONSTANTES.NATUREZAS_ESCRITURA).map(([id, label]) => ({ id, label: `${id} - ${label}` }))
        };
    }
    return null;
};

/**
 * 2. Validação Condicional de Referentes
 * Regra: Obrigatório para atos 5, 6, 7 e natureza 35
 */
export const validarReferentesObrigatoriedade = (ato) => {
    const exigeRef = ['5', '6', '7'].includes(ato.tipoAtoCep) || (ato.tipoAtoCep === '1' && ato.naturezaEscritura === '35');
    
    if (exigeRef) {
        const errosRef = [];
        
        // Adicionada a lista de opções aceitas para o Tipo de Ato
        if (!ato.temReferenteTipo) {
            errosRef.push({ 
                campo: 'ReferenteTipoAtoCep', 
                msg: "Tag 'ReferenteTipoAtoCep' é obrigatória.",
                opcoes: Object.entries(CONSTANTES.TIPOS_ATO).map(([id, label]) => ({ id, label: `${id} - ${label}` }))
            });
        }
        
        if (!ato.temReferenteCns) errosRef.push({ campo: 'ReferenteCns', msg: "Tag 'ReferenteCns' é obrigatória." });
        if (!ato.temReferenteLivro) errosRef.push({ campo: 'ReferenteLivro', msg: "Tag 'ReferenteLivro' é obrigatória." });
        if (!ato.temReferenteFolha) errosRef.push({ campo: 'ReferenteFolha', msg: "Tag 'ReferenteFolha' é obrigatória." });
        
        return errosRef.length > 0 ? errosRef : null;
    }
    return null;
};

/**
 * 3. Validação de Usucapião
 * Regra: naturezaAtaNotarialDeUsucapiao é obrigatória se tipoAtoCep = 9
 */
export const validarUsucapiao = (ato) => {
    if (ato.tipoAtoCep === '9' && !ato.naturezaAtaNotarialDeUsucapiao) {
        return {
            mensagem: "Tag 'NaturezaAtaNotarialDeUsucapiao' é obrigatória para Atas de Usucapião.",
            opcoes: Object.entries(CONSTANTES.NATUREZAS_USUCAPIAO).map(([id, label]) => ({ id, label: `${id} - ${label}` }))
        };
    }
    return null;
};

/**
 * 4. Validação das Partes e Qualidades
 * Regra: CPF válido e qualidade pertencente ao domínio
 */
export const validarDadosParte = (parte) => {
    const errosParte = [];

    if (parte.tipoDocumento?.toUpperCase() === 'CPF' && !isCpfValido(parte.numeroDocumento)) {
        errosParte.push({ campo: 'ParteNumeroDocumento', msg: `CPF (${parte.numeroDocumento}) é inválido.` });
    }

    if (parte.qualidade && !CONSTANTES.QUALIDADES_PARTE.includes(parte.qualidade.toUpperCase())) {
        errosParte.push({
            campo: 'ParteQualidade',
            msg: `Qualidade '${parte.qualidade}' inválida.`,
            opcoes: CONSTANTES.QUALIDADES_PARTE 
        });
    }

    return errosParte.length > 0 ? errosParte : null;
};

/**
 * 5. Validação de Mediação/Conciliação
 */
export const validarMediacaoConciliacao = (ato) => {
    const errosMed = [];
    if (['75', '76'].includes(ato.naturezaEscritura)) {
        if (!ato.naturezaLitigio) {
            errosMed.push({
                campo: 'NaturezaLitigio',
                msg: "Tag 'NaturezaLitigio' é obrigatória para Mediação/Conciliação.",
                opcoes: Object.entries(CONSTANTES.NATUREZAS_LITIGIO).map(([id, label]) => ({ id, label: `${id} - ${label}` }))
            });
        }
        if (!ato.acordo) {
            errosMed.push({
                campo: 'Acordo',
                msg: "Tag 'Acordo' (SIM/NÃO) é obrigatória.",
                opcoes: ['SIM', 'NÃO']
            });
        }
    }
    return errosMed.length > 0 ? errosMed : null;
};