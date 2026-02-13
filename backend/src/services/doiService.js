import fs from 'fs';
import path from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

// --- 1. CONFIGURAÇÃO ---

const loadSchema = () => {
    const schemaPath = path.resolve(process.cwd(), 'schema.json');
    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema não encontrado em: ${schemaPath}`);
    }
    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
};

let ajvValidator = null;

const getValidator = () => {
    if (!ajvValidator) {
        const ajv = new Ajv2020({ allErrors: true, strict: false });
        addFormats(ajv);
        const schema = loadSchema();
        ajvValidator = ajv.compile(schema);
    }
    return ajvValidator;
};

// --- 2. FUNÇÕES DE CORREÇÃO (Mantidas iguais) ---

const corrigirNumero = (valor) => {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
        const limpo = valor.trim().replace(',', '.');
        return limpo === '' ? null : parseFloat(limpo);
    }
    return valor;
};

const corrigirBooleano = (valor) => {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
        const v = valor.toLowerCase().trim();
        return v === 'true' || v === 's' || v === 'sim' || v === '1';
    }
    return !!valor;
};

const corrigirData = (valor) => {
    if (typeof valor !== 'string') return valor;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
        const [d, m, a] = valor.split('/');
        return `${a}-${m}-${d}`;
    }
    return valor;
};

const corrigirStringEnum = (valor) => {
    return (valor !== null && valor !== undefined) ? String(valor) : valor;
};

const corrigirObjeto = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(item => corrigirObjeto(item));
    } else if (obj !== null && typeof obj === 'object') {
        const novoObj = {};
        const CAMPOS_NUMERICOS = ['valorOperacaoImobiliaria', 'valorBaseCalculoItbiItcmd', 'valorPagoAteDataAto', 'valorPagoMoedaCorrenteDataAto', 'valorParteTransacionada', 'areaImovel', 'areaConstruida', 'participacao'];
        const CAMPOS_BOOLEANOS = ['existeDoiAnterior', 'indicadorAlienacaoFiduciaria', 'indicadorPermutaBens', 'indicadorPagamentoDinheiro', 'indicadorImovelPublicoUniao', 'indicadorAreaLoteNaoConsta', 'indicadorAreaConstruidaNaoConsta', 'indicadorNiIdentificado', 'indicadorNaoConstaParticipacaoOperacao', 'indicadorEstrangeiro', 'indicadorEspolio', 'indicadorConjuge', 'indicadorConjugeParticipa', 'indicadorCpfConjugeIdentificado', 'indicadorNaoConstaValorOperacaoImobiliaria', 'indicadorNaoConstaValorBaseCalculoItbiItcmd', 'indicadorRepresentante'];
        const CAMPOS_ENUMS = ['tipoServico', 'tipoDeclaracao', 'tipoAto', 'tipoLivro', 'naturezaTitulo', 'formaPagamento', 'destinacao', 'tipoOperacaoImobiliaria', 'tipoPessoa'];

        for (const [chave, valor] of Object.entries(obj)) {
            let novoValor = valor;
            if (CAMPOS_NUMERICOS.includes(chave)) novoValor = corrigirNumero(valor);
            else if (CAMPOS_BOOLEANOS.includes(chave) || chave.startsWith('indicador')) novoValor = corrigirBooleano(valor);
            else if (chave.startsWith('data') || chave === 'mesAnoUltimaParcela') novoValor = corrigirData(valor);
            else if (CAMPOS_ENUMS.includes(chave)) novoValor = corrigirStringEnum(valor);
            
            if (typeof novoValor === 'object') {
                novoValor = corrigirObjeto(novoValor);
            }
            novoObj[chave] = novoValor;
        }
        return novoObj;
    }
    return obj;
};

// --- 3. ALGORITMOS DE VALIDAÇÃO ---

const validarCIB = (cib) => {
    if (!cib || cib.length !== 8) return false;
    const corpo = cib.substring(0, 7);
    const dvInformado = cib.substring(7);
    if (/^\d+$/.test(corpo)) {
        const pesos = [8, 7, 6, 5, 4, 3, 2];
        let soma = 0;
        for (let i = 0; i < 7; i++) soma += parseInt(corpo[i]) * pesos[i];
        let resto = soma % 11;
        let dvCalculado = (resto === 0 || resto === 1) ? 0 : (11 - resto);
        return String(dvCalculado) === dvInformado;
    }
    // Regra Alfanumérica (Base 32 Crockford Modificada)
    const mapCrockford = {'0':0, '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'A':10, 'B':11, 'C':12, 'D':13, 'E':14, 'F':15, 'G':16, 'H':17, 'J':18, 'K':19, 'M':20, 'N':21, 'P':22, 'Q':23, 'R':24, 'S':25, 'T':26, 'V':27, 'W':28, 'X':29, 'Y':30, 'Z':31, 'I':1, 'L':1, 'O':0};
    const pesosAlfa = [4, 3, 9, 5, 7, 1, 8];
    let soma = 0;
    const corpoUpper = corpo.toUpperCase();
    for (let i = 0; i < 7; i++) {
        const char = corpoUpper[i];
        if (char === 'U') return false; 
        const valor = mapCrockford[char];
        if (valor === undefined) return false;
        soma += valor * pesosAlfa[i];
    }
    const resto = soma % 31;
    const decodeMap = Object.entries(mapCrockford).find(([key, val]) => val === resto && !['I','L','O'].includes(key));
    const dvCalculadoChar = decodeMap ? decodeMap[0] : null;
    return dvCalculadoChar === dvInformado.toUpperCase();
};

const validarCPF = (cpf) => {
    if (!cpf) return false;
    const strCPF = cpf.replace(/[^\d]/g, '');
    if (strCPF.length !== 11 || /^(\d)\1+$/.test(strCPF)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(strCPF.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    return resto === parseInt(strCPF.substring(10, 11));
};

const validarCNPJ = (cnpj) => {
    if (!cnpj) return false;
    const strCNPJ = cnpj.replace(/[^\d]/g, '');
    if (strCNPJ.length !== 14) return false;
    return true; 
};

// --- 4. VALIDAÇÃO DE REGRAS (Retorna Objetos Detalhados) ---

const criarErro = (msg, indexDecl, grupo = null, campo = null, valor = null, indexItem = null) => {
    return {
        tipo: 'NEGOCIO',
        mensagem: msg,
        localizacao: {
            declaracao_index: indexDecl,
            grupo: grupo,
            campo: campo,
            item_index: indexItem
        },
        valor_encontrado: valor
    };
};

const validarRegrasDeNegocio = (declaracao, index) => {
    const erros = [];
    
    // 4.1 Datas
    const hoje = new Date();
    const dataAto = declaracao.dataLavraturaRegistroAverbacao ? new Date(declaracao.dataLavraturaRegistroAverbacao) : null;
    const dataNegocio = declaracao.dataNegocioJuridico ? new Date(declaracao.dataNegocioJuridico) : null;

    if (dataAto && dataNegocio && dataNegocio > dataAto) {
        erros.push(criarErro('Data do Negócio Jurídico não pode ser posterior à Data do Ato.', index, null, 'dataNegocioJuridico', declaracao.dataNegocioJuridico));
    }
    if ((dataNegocio && dataNegocio > hoje) || (dataAto && dataAto > hoje)) {
        erros.push(criarErro('Datas não podem ser futuras.', index, null, 'dataLavraturaRegistroAverbacao'));
    }

    // 4.2 Imóveis (2)
    if (declaracao.tipoServico === "2") {
        if (!declaracao.matricula && !declaracao.transcricao && !declaracao.codigoNacionalMatricula) {
            erros.push(criarErro('Para Registro de Imóveis, é obrigatório informar Matrícula, Transcrição ou CNM.', index, null, 'matricula'));
        }
        if (!declaracao.tipoLivro) {
            erros.push(criarErro('Para Registro de Imóveis, o Tipo de Livro é obrigatório.', index, null, 'tipoLivro'));
        }
    }

    // 4.3 Valores
    if (!declaracao.indicadorNaoConstaValorOperacaoImobiliaria && (declaracao.valorOperacaoImobiliaria === undefined || declaracao.valorOperacaoImobiliaria === null)) {
        erros.push(criarErro('Valor da Operação é obrigatório se o indicador de "Não Consta" for falso.', index, null, 'valorOperacaoImobiliaria'));
    }
    
    if (["7", "10"].includes(declaracao.formaPagamento)) {
        if (!declaracao.mesAnoUltimaParcela) erros.push(criarErro('Mês/Ano da última parcela é obrigatório para pagamento a prazo.', index, null, 'mesAnoUltimaParcela'));
        if (declaracao.indicadorAlienacaoFiduciaria === undefined) erros.push(criarErro('Indicador de Alienação Fiduciária é obrigatório para pagamento a prazo.', index, null, 'indicadorAlienacaoFiduciaria'));
    }

    if (declaracao.indicadorPagamentoDinheiro === true && !declaracao.valorPagoMoedaCorrenteDataAto) {
        erros.push(criarErro('Valor pago em moeda corrente é obrigatório quando indicador de pagamento em dinheiro é verdadeiro.', index, null, 'valorPagoMoedaCorrenteDataAto'));
    }

    // 4.4 Imóvel
    if (declaracao.cib) {
        const cibLimpo = declaracao.cib.replace('-', '');
        if (!validarCIB(cibLimpo)) {
            erros.push(criarErro(`CIB Inválido (Dígito Verificador incorreto).`, index, 'operacao', 'cib', declaracao.cib));
        }
    }

    if (declaracao.destinacao === "1") { // Urbano
        if (!declaracao.inscricaoMunicipal) erros.push(criarErro('Inscrição Municipal é obrigatória para imóvel Urbano.', index, 'operacao', 'inscricaoMunicipal'));
        if (!declaracao.areaConstruida && !declaracao.indicadorAreaConstruidaNaoConsta) erros.push(criarErro('Área Construída é obrigatória para Urbano (ou marcar que não consta).', index, 'operacao', 'areaConstruida'));
    } else if (declaracao.destinacao === "3") { // Rural
        if (!declaracao.codigoIncra) erros.push(criarErro('Código INCRA é obrigatório para imóvel Rural.', index, 'operacao', 'codigoIncra'));
    }

    // 4.5 Pessoas e Participação
    const validarGrupoPessoas = (grupo, nomeGrupo) => {
        if (!grupo || !Array.isArray(grupo)) return;

        let somaParticipacao = 0;
        let temNaoConsta = false;

        grupo.forEach((pessoa, idx) => {
            if (pessoa.ni) {
                const niLimpo = pessoa.ni.replace(/[^\d]/g, '');
                if (niLimpo.length === 11 && !validarCPF(niLimpo)) {
                    erros.push(criarErro(`CPF inválido.`, index, nomeGrupo, 'ni', pessoa.ni, idx));
                }
                if (niLimpo.length === 14 && !validarCNPJ(niLimpo)) {
                    erros.push(criarErro(`CNPJ inválido.`, index, nomeGrupo, 'ni', pessoa.ni, idx));
                }
            }

            if (pessoa.indicadorNaoConstaParticipacaoOperacao) {
                temNaoConsta = true;
            } else {
                somaParticipacao += (parseFloat(pessoa.participacao) || 0);
            }
        });

        if (!temNaoConsta && grupo.length > 0) {
            somaParticipacao = Math.round(somaParticipacao * 100) / 100;
            if (somaParticipacao < 99 || somaParticipacao > 100) {
                erros.push(criarErro(
                    `Soma das participações deve estar entre 99% e 100%.`, 
                    index, 
                    nomeGrupo, 
                    'participacao', 
                    `${somaParticipacao}%`, 
                    null
                ));
            }
        }
    };

    validarGrupoPessoas(declaracao.alienantes, 'alienantes');
    validarGrupoPessoas(declaracao.adquirentes, 'adquirentes');

    return erros;
};

// --- 5. PROCESSADOR ---

export const processarDoi = async (filePath) => {
    let rawData = fs.readFileSync(filePath, 'utf8');
    
    // Remove BOM
    if (rawData.charCodeAt(0) === 0xFEFF) {
        rawData = rawData.slice(1);
    }

    let jsonOriginal;
    try {
        jsonOriginal = JSON.parse(rawData);
    } catch (e) {
        throw new Error(`Arquivo não é um JSON válido. Detalhes: ${e.message}`);
    }

    const jsonCorrigido = corrigirObjeto(jsonOriginal);
    const validate = getValidator();
    const valid = validate(jsonCorrigido);
    
    let erros = [];

    // Erros de Schema (Estrutura)
    if (!valid) {
        erros = validate.errors.map(err => ({
            tipo: 'SCHEMA',
            mensagem: err.message,
            localizacao: {
                caminho: err.instancePath || 'Raiz',
                campo: err.params.missingProperty || null
            },
            valor_encontrado: null
        }));
    }

    // Erros de Regra de Negócio
    if (jsonCorrigido.declaracoes && Array.isArray(jsonCorrigido.declaracoes)) {
        jsonCorrigido.declaracoes.forEach((decl, index) => {
            const errosLogicos = validarRegrasDeNegocio(decl, index);
            if (errosLogicos.length > 0) {
                erros.push(...errosLogicos);
            }
        });
    }

    return {
        is_valid: erros.length === 0,
        errors: erros,
        data: jsonCorrigido
    };
};