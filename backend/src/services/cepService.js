import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import * as CONSTANTES from '../utils/cepConstants.js';

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
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

// --- Serviço Principal ---

export const validarXmlCep = async (filePath) => {
    const erros = [];
    const atosAgrupados = new Map();

    const addErro = (linha, localizacao, nomeParte, mensagem, tipoErro, opcoesAceitas = undefined) => {
        erros.push({
            linhaDoArquivo: linha || 'Desconhecida',
            localizacao,
            nomeDaParte: nomeParte || null,
            mensagemDeErro: mensagem,
            tipoDeErro: tipoErro,
            opcoesAceitas
        });
    };

    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoCep> encontrada." }] };
    }

    // --- PASSO 1: AGRUPAMENTO (Chave de Unicidade) ---
    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;
        
        const livro = getNodeText(node, "Livro") || "";
        const livroComp = getNodeText(node, "LivroComplemento") || "";
        const folha = getNodeText(node, "Folha") || "";
        const folhaComp = getNodeText(node, "FolhaComplemento") || "";
        const chave = `${livro}-${livroComp}-${folha}-${folhaComp}`;

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

        const refCns = getNodeText(node, "ReferenteCns");
        if (refCns || getNodeText(node, "ReferenteTipoAtoCep")) {
            ato.referentes.push({
                linha,
                tipoAtoCep: getNodeText(node, "ReferenteTipoAtoCep"),
                cns: refCns,
                livro: getNodeText(node, "ReferenteLivro"),
                folha: getNodeText(node, "ReferenteFolha"),
                desconhecido: getNodeText(node, "Desconhecido")
            });
        }
    }

    // --- PASSO 2: VALIDAÇÃO DAS REGRAS (DATA DICTIONARY) ---
    atosAgrupados.forEach((ato) => {
        const loc = `Livro ${ato.livro}${ato.livroComp} Folha ${ato.folha}${ato.folhaComp}`;

        // 2.1. Cabeçalho
        if (!ato.tipoAtoCep) addErro(ato.linhaBase, loc, null, "tipoAtoCep é obrigatório.", "Obrigatoriedade", CONSTANTES.TIPOS_ATO);
        
        if (ato.tipoAtoCep === '1') {
            if (!ato.naturezaEscritura) addErro(ato.linhaBase, loc, null, "naturezaEscritura é obrigatória para Escrituras.", "Obrigatoriedade", CONSTANTES.NATUREZAS_ESCRITURA);
            
            if (['15', '20'].includes(ato.naturezaEscritura)) {
                if (!ato.regimeBens) addErro(ato.linhaBase, loc, null, "regimeBens é obrigatório para Declaratórias/Dissolução de União Estável.", "Obrigatoriedade", CONSTANTES.REGIMES_BENS_XML);
            }

            if (['75', '76'].includes(ato.naturezaEscritura)) {
                if (!ato.naturezaLitigio) addErro(ato.linhaBase, loc, null, "naturezaLitigio é obrigatória para Mediação/Conciliação.", "Obrigatoriedade", CONSTANTES.NATUREZAS_LITIGIO);
                if (!ato.acordo) addErro(ato.linhaBase, loc, null, "acordo (SIM/NÃO) é obrigatório para Mediação/Conciliação.", "Obrigatoriedade", ["SIM", "NÃO"]);
            }
        }

        if (ato.tipoAtoCep === '9' && !ato.naturezaAtaNotarialDeUsucapiao) {
            addErro(ato.linhaBase, loc, null, "naturezaAtaNotarialDeUsucapiao é obrigatória para este ato.", "Obrigatoriedade", CONSTANTES.NATUREZAS_USUCAPIAO);
        }

        if (ato.mne && ato.mne.length !== 29) {
            addErro(ato.linhaBase, loc, null, "mne deve ter exatamente 29 caracteres.", "Formato Inválido");
        }

        // Validações de Cabeçalho Obrigatórias Simples
        if (!ato.data) addErro(ato.linhaBase, loc, null, "A data de lavratura (DataAto) é obrigatória.", "Obrigatoriedade");
        if (!ato.livro) addErro(ato.linhaBase, loc, null, "livro é obrigatório.", "Obrigatoriedade");
        if (!ato.folha) addErro(ato.linhaBase, loc, null, "folha é obrigatória.", "Obrigatoriedade");
        if (!ato.valor) addErro(ato.linhaBase, loc, null, "valor financeiro do ato é obrigatório.", "Obrigatoriedade");

        // 2.2. Referentes
        const exigeRef = ['5', '6', '7'].includes(ato.tipoAtoCep) || (ato.tipoAtoCep === '1' && ato.naturezaEscritura === '35');
        if (exigeRef && ato.referentes.length === 0) {
            addErro(ato.linhaBase, loc, null, "Atos de Revogação, Renúncia, Substabelecimento ou Rerratificação exigem grupo Referentes.", "Regra de Negócio");
        }

        // 2.4. Partes
        if (ato.partes.length === 0) {
            addErro(ato.linhaBase, loc, null, "Pelo menos uma parte é obrigatória por ato.", "Obrigatoriedade");
        } else {
            ato.partes.forEach(p => {
                if (!p.tipoDoc) addErro(p.linha, loc, p.nome, "tipoDocumento da parte é obrigatório.", "Obrigatoriedade", CONSTANTES.TIPOS_DOCUMENTO);
                if (!p.qualidade) addErro(p.linha, loc, p.nome, "qualidade da parte é obrigatória.", "Obrigatoriedade", CONSTANTES.QUALIDADES_PARTE);
                
                // Validação Condicional do Número do Documento
                const tiposQueExigemDoc = ['CPF', 'CNPJ', 'RNM'];
                if (tiposQueExigemDoc.includes(p.tipoDoc?.toUpperCase()) && !p.numDoc) {
                    addErro(p.linha, loc, p.nome, `O número do documento é obrigatório quando o tipo informado é ${p.tipoDoc}.`, "Obrigatoriedade");
                }

                if (p.tipoDoc?.toUpperCase() === 'CPF' && p.numDoc) {
                    if (!isCpfValido(p.numDoc)) addErro(p.linha, loc, p.nome, `CPF informado (${p.numDoc}) é matematicamente inválido.`, "Validação Matemática");
                }
                
                if (p.qualidade && !CONSTANTES.QUALIDADES_PARTE.includes(p.qualidade.toUpperCase())) {
                    addErro(p.linha, loc, p.nome, `Qualidade '${p.qualidade}' inválida.`, "Domínio Inválido", CONSTANTES.QUALIDADES_PARTE);
                }
            });
        }
    });

    return { totalAtos: atosAgrupados.size, erros, sucesso: erros.length === 0 };
};

/**
 * Aplica correções em um XML CEP baseado em um array de instruções
 * @param {string} filePath - Caminho do arquivo original
 * @param {Array} correcoes - Lista de objetos { linhaDoArquivo, campo, novoValor }
 */
export const aplicarCorrecoesXml = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    correcoes.forEach(conserto => {
        // Busca o nó AtoCep que corresponde à linha exata do erro
        for (let i = 0; i < atosNodeList.length; i++) {
            const node = atosNodeList[i];
            
            // O xmldom nos dá a linha exata onde a tag <AtoCep> começa
            if (node.lineNumber === conserto.linhaDoArquivo) {
                let tag = node.getElementsByTagName(conserto.campo)[0];
                
                if (tag) {
                    tag.textContent = conserto.novoValor;
                } else {
                    // Se a tag não existir (ex: RegimeBens ausente), nós a criamos
                    const novaTag = xmlDoc.createElement(conserto.campo);
                    novaTag.textContent = conserto.novoValor;
                    node.appendChild(novaTag);
                }
            }
        }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
};