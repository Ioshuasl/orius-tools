import fs from 'fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import * as CONST from '../utils/doiConstants.js';
import * as HELPER from '../utils/doiHelper.js';

// Importação do schema enviado (Draft 2020-12)
import doiSchema from '../schemas/schema.json' with { type: 'json' };

// Configuração do validador AJV
const ajv = new Ajv2020({ allErrors: true, verbose: true });
addFormats(ajv); 

const validate = ajv.compile(doiSchema);

/**
 * Valida o arquivo JSON da DOI, aplicando higienização automática e regras de negócio.
 */
export const validarJsonDoi = async (filePath) => {
    const erros = [];
    let doiData;
    let foiHigienizado = false;

    try {
        const conteudoBruto = fs.readFileSync(filePath, 'utf-8');
        
        // --- PASSO 0: HIGIENIZAÇÃO (Limpeza de CIB, Sintaxe e Campos Vazios) ---
        // Agora recebe o objeto { dados, foiHigienizado }
        const resultadoHigienizacao = HELPER.higienizarDoiJson(conteudoBruto);
        doiData = resultadoHigienizacao.dados;
        foiHigienizado = resultadoHigienizacao.foiHigienizado;

    } catch (err) {
        return { 
            sucesso: false, 
            totalAtos: 0, 
            erros: [{ mensagemDeErro: `Erro de Leitura/Sintaxe: ${err.message}`, tipoDeErro: "Estrutura" }],
            foiHigienizado: false
        };
    }

    // --- PASSO 1: VALIDAÇÃO ESTRUTURAL (JSON SCHEMA) ---
    // Valida o dado já limpo contra o schema.json
    const valid = validate(doiData);
    if (!valid) {
        validate.errors.forEach(err => {
            erros.push({
                localizacao: err.instancePath || "Raiz do arquivo",
                mensagemDeErro: `Campo ${err.params.missingProperty || err.instancePath} ${err.message}`,
                tipoDeErro: "Esquema JSON"
            });
        });
        
        // Se a estrutura básica falhar, retornamos o conteúdo limpo para o usuário ver o que foi corrigido
        return { 
            sucesso: false, 
            totalAtos: doiData.declaracoes?.length || 0, 
            erros,
            foiHigienizado,
            conteudoLimpo: doiData 
        };
    }

    // --- PASSO 2: VALIDAÇÃO DE REGRAS DE NEGÓCIO (LÓGICA) ---
    doiData.declaracoes.forEach((decl, index) => {
        const local = `Livro ${decl.numeroLivro || 'N/A'} Folha ${decl.folha || 'N/A'}`;
        const codAto = decl.tipoAto;
        
        const addErroNegocio = (msg, campo) => {
            erros.push({
                indexDecl: index,
                localizacao: local,
                tipoAto: CONST.TIPO_ATO[codAto] || "Ato DOI",
                mensagemDeErro: msg,
                tipoDeErro: "Regra de Negócio",
                campoRelacionado: campo
            });
        };

        // Lógica de Datas (Não pode ser futura ou negócio > ato)
        const erroData = HELPER.validarConformidadeDatas(decl.dataNegocioJuridico, decl.dataLavraturaRegistroAverbacao);
        if (erroData) addErroNegocio(erroData, "dataNegocioJuridico");

        // Algoritmo do CIB (O CIB já chega aqui sem hífen pela higienização)
        if (decl.cib && !HELPER.validarCib(decl.cib)) {
            addErroNegocio(`Dígito verificador do CIB (${decl.cib}) inválido.`, "cib");
        }

        // Soma das Participações (99% a 100%)
        const validaAlienantes = HELPER.validarSomaParticipacao(decl.alienantes, false);
        if (typeof validaAlienantes === 'string') addErroNegocio(validaAlienantes, "alienantes");
        else if (!validaAlienantes) addErroNegocio("Soma das participações dos Alienantes fora do intervalo 99-100%.", "alienantes");

        const validaAdquirentes = HELPER.validarSomaParticipacao(decl.adquirentes, false);
        if (typeof validaAdquirentes === 'string') addErroNegocio(validaAdquirentes, "adquirentes");
        else if (!validaAdquirentes) addErroNegocio("Soma das participações dos Adquirentes fora do intervalo 99-100%.", "adquirentes");
    });

    return { 
        sucesso: erros.length === 0, 
        totalAtos: doiData.declaracoes.length, 
        erros,
        foiHigienizado, // Informa se o sistema limpou algo (ex: hífens)
        conteudoLimpo: doiData // Retorna o JSON processado para download
    };
};

/**
 * Função para aplicar correções manuais enviadas pelo frontend
 */
export const corrigirJsonDoi = async (filePath, correcoes) => {
    const conteudoBruto = fs.readFileSync(filePath, 'utf-8');
    
    // Higieniza primeiro para garantir que as correções manuais sejam aplicadas sobre um dado limpo
    const { dados: doiData } = HELPER.higienizarDoiJson(conteudoBruto);

    correcoes.forEach(conserto => {
        const decl = doiData.declaracoes[conserto.indexDecl];
        if (decl) {
            // Aplica o novo valor no campo indicado
            decl[conserto.campo] = conserto.novoValor;
        }
    });

    return JSON.stringify(doiData, null, 2);
};