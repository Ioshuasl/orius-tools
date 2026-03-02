import { PATTERNS } from './crcConstants.js';

/**
 * Remove caracteres invisíveis ou BOM que podem corromper o parser de XML.
 */
export const higienizarXmlCrc = (xmlString) => {
    if (!xmlString) return "";
    // Remove o Byte Order Mark (BOM) se existir e espaços desnecessários no início/fim
    return xmlString.replace(/^\uFEFF/, '').trim();
};

/**
 * Valida a integridade da Matrícula de 32 dígitos (Padrão CNJ).
 * O XSD valida apenas os 32 dígitos, aqui você pode expandir para validar o dígito verificador.
 */
export const validarMatricula = (matricula) => {
    if (!matricula) return false;
    return PATTERNS.MATRICULA.test(matricula); // Validação de estrutura básica [cite: 1, 4]
};

/**
 * Compara se a data do fato (nascimento/óbito) não é futura em relação ao registro.
 */
export const validarConformidadeDatas = (dataFato, dataRegistro) => {
    if (!dataFato || !dataRegistro) return null;

    // Converte DD/MM/AAAA para objeto Date (Padrão de data no XSD tem maxLength 10 )
    const [dF, mF, aF] = dataFato.split('/').map(Number);
    const [dR, mR, aR] = dataRegistro.split('/').map(Number);

    const fato = new Date(aF, mF - 1, dF);
    const registro = new Date(aR, mR - 1, dR);
    const hoje = new Date();

    if (fato > hoje) return "A data do fato não pode ser uma data futura.";
    if (fato > registro) return "A data do fato não pode ser posterior à data do registro.";

    return null;
};

/**
 * Validação de CPF (Algoritmo padrão brasileiro).
 * O XSD limita a 11 caracteres, mas não valida o dígito verificador[cite: 1, 14].
 */
export const validarCpf = (cpf) => {
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length !== 11 || !!limpo.match(/(\d)\1{10}/)) return false;
    
    // Lógica simplificada de dígito verificador
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(limpo.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(limpo.substring(10, 11))) return false;
    
    return true;
};