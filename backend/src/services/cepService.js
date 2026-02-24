import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import * as CONSTANTES from '../utils/cepConstants.js';

/**
 * Helper: Validação Matemática de CPF
 */
const isCpfValido = (cpf) => {
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
 * Helper: Captura texto de tags XML
 */
const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

/**
 * SERVIÇO DE VALIDAÇÃO CEP
 */
export const validarXmlCep = async (filePath) => {
    const erros = [];
    const atosAgrupados = new Map();

    /**
     * Helper interno para padronizar o erro conforme types.ts
     */
    const addErro = (linha, local, parte, msg, tipo, codAto = null, opcoes = undefined) => {
        // Mapeia o código para nome amigável (Ex: '1' -> 'Escritura')
        const nomeAmigavelAto = codAto ? (CONSTANTES.TIPOS_ATO[codAto] || `Ato ${codAto}`) : "Ato CEP";
        
        erros.push({
            linhaDoArquivo: linha || '?',
            localizacao: local,
            nomeDaParte: parte || null,
            tipoAto: nomeAmigavelAto, // Interface genérica
            mensagemDeErro: msg,
            tipoDeErro: tipo,
            opcoesAceitas: opcoes
        });
    };

    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoCep> encontrada." }] };
    }

    // --- PASSO 1: AGRUPAMENTO (Consolidação por Unicidade) ---
    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;
        
        const livro = getNodeText(node, "Livro") || "";
        const livroComp = getNodeText(node, "LivroComplemento") || "";
        const folha = getNodeText(node, "Folha") || "";
        const folhaComp = getNodeText(node, "FolhaComplemento") || "";
        const chave = `${livro}-${livroComp}-${folha}-${folhaComp}`; // Chave de unicidade

        if (!atosAgrupados.has(chave)) {
            atosAgrupados.set(chave, {
                linhaBase: linha,
                tipoAtoCep: getNodeText(node, "TipoAtoCep"),
                naturezaEscritura: getNodeText(node, "NaturezaEscritura"),
                naturezaAtaNotarialDeUsucapiao: getNodeText(node, "NaturezaAtaNotarialDeUsucapiao"),
                mne: getNodeText(node, "Mne"),
                data: getNodeText(node, "DataAto"),
                livro, livroComp, folha, folhaComp,
                valor: getNodeText(node, "Valor"),
                regimeBens: getNodeText(node, "RegimeBens"),
                naturezaLitigio: getNodeText(node, "NaturezaLitigio"),
                acordo: getNodeText(node, "Acordo"),
                partes: [],
                referentes: []
            });
        }

        const ato = atosAgrupados.get(chave);
        
        // Coleta de Partes
        const pNome = getNodeText(node, "ParteNome");
        if (pNome) {
            ato.partes.push({
                linha,
                nome: pNome,
                tipoDoc: getNodeText(node, "ParteTipoDocumento"),
                numDoc: getNodeText(node, "ParteNumeroDocumento"),
                qualidade: getNodeText(node, "ParteQualidade")
            });
        }

        // Coleta de Referentes
        const refCns = getNodeText(node, "ReferenteCns");
        if (refCns || getNodeText(node, "ReferenteTipoAtoCep")) {
            ato.referentes.push({
                linha,
                cns: refCns,
                livro: getNodeText(node, "ReferenteLivro")
            });
        }
    }

    // --- PASSO 2: VALIDAÇÃO DAS REGRAS (CEP.MD) ---
    atosAgrupados.forEach((ato) => {
        const loc = `Livro ${ato.livro} Folha ${ato.folha}`;
        const codAto = ato.tipoAtoCep;

        // 2.1. Validação de Cabeçalho e Domínios
        if (!codAto) {
            addErro(ato.linhaBase, loc, null, "tipoAtoCep é obrigatório.", "Obrigatoriedade", null, Object.keys(CONSTANTES.TIPOS_ATO));
        } else if (!CONSTANTES.TIPOS_ATO[codAto]) {
            addErro(ato.linhaBase, loc, null, `Código de ato '${codAto}' inválido.`, "Domínio", null, Object.keys(CONSTANTES.TIPOS_ATO));
        }

        // Condicional: Escritura (Tipo 1) exige Natureza
        if (codAto === '1' && !ato.naturezaEscritura) {
            addErro(ato.linhaBase, loc, null, "naturezaEscritura é obrigatória para Escrituras.", "Obrigatoriedade", codAto, Object.keys(CONSTANTES.NATUREZAS_ESCRITURA));
        }

        // Condicional: Usucapião (Tipo 9)
        if (codAto === '9' && !ato.naturezaAtaNotarialDeUsucapiao) {
            addErro(ato.linhaBase, loc, null, "naturezaAtaNotarialDeUsucapiao é obrigatória.", "Obrigatoriedade", codAto, Object.keys(CONSTANTES.NATUREZAS_USUCAPIAO));
        }

        // Condicional: Mediação/Conciliação (Naturezas 75/76)
        if (ato.naturezaEscritura === '75' || ato.naturezaEscritura === '76') {
            if (!ato.naturezaLitigio) addErro(ato.linhaBase, loc, null, "naturezaLitigio é obrigatória.", "Obrigatoriedade", codAto, Object.keys(CONSTANTES.NATUREZAS_LITIGIO));
            if (!ato.acordo) addErro(ato.linhaBase, loc, null, "acordo (SIM/NÃO) é obrigatório.", "Obrigatoriedade", codAto, ["SIM", "NÃO"]);
        }

        // 2.2. Validação de Referentes (Atos de Revogação/Rerratificação)
        const exigeRef = ['5', '6', '7'].includes(codAto) || (codAto === '1' && ato.naturezaEscritura === '35');
        if (exigeRef && ato.referentes.length === 0) {
            addErro(ato.linhaBase, loc, null, "Este ato exige o grupo de Referentes (ato antecessor).", "Regra de Negócio", codAto);
        }

        // 2.3. Validação de Partes
        if (ato.partes.length === 0) {
            addErro(ato.linhaBase, loc, null, "Pelo menos uma parte é obrigatória.", "Obrigatoriedade", codAto);
        } else {
            ato.partes.forEach(p => {
                if (p.tipoDoc?.toUpperCase() === 'CPF' && !isCpfValido(p.numDoc)) {
                    addErro(p.linha, loc, p.nome, `CPF (${p.numDoc}) é inválido.`, "Validação Matemática", codAto);
                }
                
                const qualValida = CONSTANTES.QUALIDADES_PARTE.includes(p.qualidade?.toUpperCase());
                if (p.qualidade && !qualValida) {
                    addErro(p.linha, loc, p.nome, `Qualidade '${p.qualidade}' inválida.`, "Domínio", codAto, CONSTANTES.QUALIDADES_PARTE);
                }
            });
        }
    });

    return { totalAtos: atosAgrupados.size, erros, sucesso: erros.length === 0 };
};

/**
 * APLICAÇÃO DE CORREÇÕES (Otimizada com Map)
 */
export const aplicarCorrecoesXml = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    // Indexação O(1) por linha
    const nodesByLine = new Map();
    for (let i = 0; i < atosNodeList.length; i++) {
        nodesByLine.set(atosNodeList[i].lineNumber, atosNodeList[i]);
    }

    correcoes.forEach(conserto => {
        const node = nodesByLine.get(conserto.linhaDoArquivo);
        if (node) {
            let tag = node.getElementsByTagName(conserto.campo)[0];
            if (tag) {
                tag.textContent = conserto.novoValor;
            } else {
                const novaTag = xmlDoc.createElement(conserto.campo);
                novaTag.textContent = conserto.novoValor;
                node.appendChild(novaTag);
            }
        }
    });

    return new XMLSerializer().serializeToString(xmlDoc);
};