/**
 * Funções Auxiliares para Validação de DOI
 */

// --- Validações de Data ---

export const isDataFutura = (dataString) => {
    const data = new Date(dataString);
    const hoje = new Date();
    return data > hoje;
};

export const validarConformidadeDatas = (dataNegocio, dataAto) => {
    const dNegocio = new Date(dataNegocio);
    const dAto = new Date(dataAto);
    const hoje = new Date();

    if (dNegocio > hoje) return "Data do negócio não pode ser futura.";
    if (dNegocio > dAto) return "Data do negócio não pode ser maior que a data do ato.";
    return null;
};

// --- Validações de Participação ---

/**
 * Valida a soma das participações de um grupo (Alienantes ou Adquirentes)
 * Regra: 99% <= Soma <= 100%, exceto se houver flag "Não Consta"
 */
export const validarSomaParticipacao = (partes, indicadorNaoConstaGeral) => {
    if (indicadorNaoConstaGeral) return true;

    const soma = partes.reduce((acc, p) => {
        // Regra adicional: se participação for 0, flag individual deve ser true
        if (Number(p.participacao) === 0 && !p.indicadorNaoConstaParticipacaoOperacao) {
            return -1; // Sinaliza erro específico
        }
        return acc + Number(p.participacao || 0);
    }, 0);

    if (soma === -1) return "Partes com 0% devem marcar 'Não Consta Participação'.";
    return soma >= 99 && soma <= 100;
};

// --- Algoritmo de Validação do CIB ---

const CROCKFORD_ENCODE = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const validarCib = (cibOriginal) => {
    if (!cibOriginal) return false;
    
    // Limpeza: remove hífen e trata equivalências
    let cib = cibOriginal.replace(/-/g, '').toUpperCase();
    cib = cib.replace(/I|L/g, '1').replace(/O/g, '0');
    
    if (cib.length !== 8 || cib.includes('U')) return false;

    const corpo = cib.substring(0, 7);
    const dvInformado = cib.substring(7, 8);
    const isTotalmenteNumerico = /^\d+$/.test(corpo);

    if (isTotalmenteNumerico) {
        // Módulo 11 (Pesos: 8, 7, 6, 5, 4, 3, 2)
        const pesos = [8, 7, 6, 5, 4, 3, 2];
        let soma = 0;
        for (let i = 0; i < 7; i++) {
            soma += parseInt(corpo[i]) * pesos[i];
        }
        const resto = soma % 11;
        const dvCalculado = (resto === 0 || resto === 1) ? "0" : (11 - resto).toString();
        return dvInformado === dvCalculado;
    } else {
        // Alfanumérico: Módulo 31 (Pesos: 4, 3, 9, 5, 7, 1, 8)
        const pesos = [4, 3, 9, 5, 7, 1, 8];
        let soma = 0;
        for (let i = 0; i < 7; i++) {
            const valorCaractere = CROCKFORD_ENCODE.indexOf(corpo[i]);
            if (valorCaractere === -1) return false;
            soma += valorCaractere * pesos[i];
        }
        const resto = soma % 31;
        const dvCalculado = CROCKFORD_ENCODE[resto];
        return dvInformado === dvCalculado;
    }
};

// --- Validação Estrutural Básica ---

export const validarEstruturaJsonDoi = (json) => {
    if (!json || typeof json !== 'object') return "JSON inválido.";
    if (!Array.isArray(json.declaracoes)) return "Falta a chave 'declaracoes' como um array.";
    if (json.declaracoes.length === 0) return "O lote de declarações está vazio.";
    return null;
};

/**
 * Higieniza o conteúdo bruto e o objeto da DOI para corrigir falhas de sistemas legados.
 * Retorna o objeto processado e uma flag indicando se houve alterações.
 */
export const higienizarDoiJson = (conteudoBruto) => {
    // 1. Correção de Sintaxe Bruta (Regex para evitar quebra do JSON.parse)
    // Sistemas legados em Delphi podem gerar ": ;" ou deixar vírgulas sobrando
    let jsonLimpo = conteudoBruto
        .replace(/:\s*;/g, ': null') 
        .replace(/:\s*,/g, ': null,')
        .replace(/:\s*}/g, ': null}');

    const mudouSintaxe = jsonLimpo !== conteudoBruto;
    let mudouDados = false;

    try {
        const obj = JSON.parse(jsonLimpo);

        // 2. Normalização de Campos dentro das declarações
        if (obj.declaracoes && Array.isArray(obj.declaracoes)) {
            obj.declaracoes = obj.declaracoes.map(decl => {
                
                // --- REGRA: Limpeza automática do CIB ---
                // Remove hífens (ex: 4206261-6 -> 42062616) para caber no maxLength: 8 do Schema
                if (decl.cib && typeof decl.cib === 'string') {
                    const cibLimpo = decl.cib.replace(/-/g, '').toUpperCase();
                    if (decl.cib !== cibLimpo) {
                        decl.cib = cibLimpo;
                        mudouDados = true;
                    }
                }

                // --- REGRA: Normalização de Campos Monetários ---
                // Se o campo existir mas estiver vazio/null, removemos para não ferir o tipo 'number' do Schema
                const camposMonetarios = [
                    'valorOperacaoImobiliaria', 
                    'valorBaseCalculoItbiItcmd', 
                    'valorPagoMoedaCorrenteDataAto',
                    'valorPagoAteDataAto'
                ];

                camposMonetarios.forEach(campo => {
                    // Só processa se a declaração realmente possuir a chave
                    if (Object.prototype.hasOwnProperty.call(decl, campo)) {
                        const valor = decl[campo];
                        if (valor === "" || valor === undefined || valor === null) {
                            delete decl[campo];
                            mudouDados = true;
                        }
                    }
                });

                return decl;
            });
        }

        return { 
            dados: obj, 
            foiHigienizado: mudouSintaxe || mudouDados 
        };

    } catch (e) {
        // Erro fatal se o JSON for irreparável
        throw new Error("Falha crítica na estrutura do JSON: o arquivo é inválido mesmo após a higienização.");
    }
};