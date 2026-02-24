import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import * as HELPER from '../utils/cepHelper.js';
import * as CONSTANTES from '../utils/cepConstants.js';

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

    const addErro = (linha, local, parte, msg, tipo, codAto = null, opcoes = undefined) => {
        const nomeAmigavelAto = codAto ? (CONSTANTES.TIPOS_ATO[codAto] || `Ato ${codAto}`) : "Ato CEP";
        erros.push({
            linhaDoArquivo: linha,
            localizacao: local,
            nomeDaParte: parte,
            tipoAto: nomeAmigavelAto,
            mensagemDeErro: msg,
            tipoDeErro: tipo,
            opcoesAceitas: opcoes // Repassa o array de {id, label} ou strings
        });
    };

    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoCep> encontrada." }] };
    }

    // --- PASSO 1: AGRUPAMENTO E COLETA (Consolidação por Livro/Folha) ---
    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;
        const livro = getNodeText(node, "Livro") || "";
        const folha = getNodeText(node, "Folha") || "";
        const chave = `${livro}-${folha}`;

        if (!atosAgrupados.has(chave)) {
            atosAgrupados.set(chave, {
                linhaBase: linha,
                tipoAtoCep: getNodeText(node, "TipoAtoCep"),
                naturezaEscritura: getNodeText(node, "NaturezaEscritura"),
                naturezaAtaNotarialDeUsucapiao: getNodeText(node, "NaturezaAtaNotarialDeUsucapiao"),
                naturezaLitigio: getNodeText(node, "NaturezaLitigio"),
                acordo: getNodeText(node, "Acordo"),
                livro, folha,
                temReferenteTipo: !!getNodeText(node, "ReferenteTipoAtoCep"),
                temReferenteCns: !!getNodeText(node, "ReferenteCns"),
                temReferenteLivro: !!getNodeText(node, "ReferenteLivro"),
                temReferenteFolha: !!getNodeText(node, "ReferenteFolha"),
                partes: []
            });
        }

        const ato = atosAgrupados.get(chave);
        ato.partes.push({
            linha,
            nome: getNodeText(node, "ParteNome"),
            tipoDocumento: getNodeText(node, "ParteTipoDocumento"),
            numeroDocumento: getNodeText(node, "ParteNumeroDocumento"),
            qualidade: getNodeText(node, "ParteQualidade")
        });
    }

    // --- PASSO 2: VALIDAÇÃO USANDO OS AUXILIARES DO CEP_HELPER ---
    atosAgrupados.forEach((ato) => {
        const loc = `Livro ${ato.livro} Folha ${ato.folha}`;

        // 2.1. Natureza da Escritura (Obrigatória se Tipo 1)
        const erroNat = HELPER.validarNaturezaObrigatoria(ato);
        if (erroNat) addErro(ato.linhaBase, loc, null, erroNat.mensagem, "Obrigatoriedade", ato.tipoAtoCep, erroNat.opcoes);

        // 2.2. Referentes (Revogação, Renúncia, Substabelecimento e Natureza 35)
        const errosRef = HELPER.validarReferentesObrigatoriedade(ato);
        if (errosRef) {
            errosRef.forEach(e => addErro(ato.linhaBase, loc, "Grupo Referente", e.msg, "Obrigatoriedade", ato.tipoAtoCep, e.opcoes));
        }

        // 2.3. Ata de Usucapião
        const erroUsu = HELPER.validarUsucapiao(ato);
        if (erroUsu) addErro(ato.linhaBase, loc, null, erroUsu.mensagem, "Obrigatoriedade", ato.tipoAtoCep, erroUsu.opcoes);

        // 2.4. Mediação e Conciliação
        const errosMed = HELPER.validarMediacaoConciliacao(ato);
        if (errosMed) {
            errosMed.forEach(e => addErro(ato.linhaBase, loc, null, e.msg, "Obrigatoriedade", ato.tipoAtoCep, e.opcoes));
        }

        // 2.5. Dados das Partes (Validação individual por linha)
        ato.partes.forEach(p => {
            const errosP = HELPER.validarDadosParte(p);
            if (errosP) {
                errosP.forEach(e => addErro(p.linha, loc, p.nome, e.msg, "Validação", ato.tipoAtoCep, e.opcoes));
            }
        });
    });

    return { totalAtos: atosAgrupados.size, erros, sucesso: erros.length === 0 };
};

/**
 * APLICAÇÃO DE CORREÇÕES COM BUSCA POR LOCALIZAÇÃO E PROPAGAÇÃO
 */
export const aplicarCorrecoesXml = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCep");

    // Tags que devem ser propagadas para todos os blocos do mesmo ato
    const tagsDeCabecalhoAto = [
        'TipoAtoCep', 'NaturezaEscritura', 'DataAto', 'Valor', 'RegimeBens',
        'ReferenteTipoAtoCep', 'ReferenteCns', 'ReferenteLivro', 'ReferenteFolha',
        'NaturezaAtaNotarialDeUsucapiao', 'NaturezaLitigio', 'Acordo'
    ];

    correcoes.forEach(conserto => {
        const match = conserto.localizacao.match(/Livro\s+(\d+)\s+Folha\s+(\d+)/);
        if (!match) return;

        const livroAlvo = match[1];
        const folhaAlvo = match[2];

        for (let i = 0; i < atosNodeList.length; i++) {
            const node = atosNodeList[i];
            const livroNode = getNodeText(node, "Livro");
            const folhaNode = getNodeText(node, "Folha");

            if (livroNode === livroAlvo && folhaNode === folhaAlvo) {
                const ehTagDeAto = tagsDeCabecalhoAto.includes(conserto.campo);
                const ehLinhaExata = node.lineNumber === conserto.linhaDoArquivo;

                if (ehTagDeAto || ehLinhaExata) {
                    let tag = node.getElementsByTagName(conserto.campo)[0];
                    if (tag) {
                        tag.textContent = conserto.novoValor;
                    } else {
                        const novaTag = xmlDoc.createElement(conserto.campo);
                        novaTag.textContent = conserto.novoValor;
                        node.appendChild(novaTag);
                    }
                }
            }
        }
    });

    return new XMLSerializer().serializeToString(xmlDoc);
};