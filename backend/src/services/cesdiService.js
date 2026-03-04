import fs from 'fs';
import { DOMParser } from 'xmldom';
import * as CONST from '../utils/cesdiConstants.js';
import * as Helper from '../utils/cesdiHelper.js';

/**
 * Função Principal de Validação CESDI com Visão Ampla
 */
export const validarXmlCesdi = async (filePath) => {
    const errosGerais = [];
    const atosAgrupados = new Map();

    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCesdi");

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoCesdi> encontrada." }], atos: [] };
    }

    // --- PASSO 1: AGRUPAMENTO (Consolidação por Livro/Folha) ---
    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;
        const livro = Helper.getNodeText(node, "Livro");
        const folha = Helper.getNodeText(node, "Folha");
        const chave = `${livro}-${folha}`;

        if (!atosAgrupados.has(chave)) {
            atosAgrupados.set(chave, {
                id: chave,
                linhaBase: linha,
                tipoAtoCesdi: Helper.getNodeText(node, "TipoAtoCesdi"),
                nomeAto: CONST.TIPOS_ATO_CESDI[Helper.getNodeText(node, "TipoAtoCesdi")] || "Ato Desconhecido",
                dataAto: Helper.getNodeText(node, "DataAto"),
                livro, folha,
                dataCasamento: Helper.getNodeText(node, "DataCasamento"),
                regimeBens: Helper.getNodeText(node, "RegimeBens"),
                responsavel: Helper.getNodeText(node, "RespFilhosMenores"),
                partes: [],
                errosDoAto: [], // Erros específicos deste accordion
                sucesso: true    // Assume sucesso até encontrar um erro
            });
        }

        const pNome = Helper.getNodeText(node, "NomeParte");
        if (pNome) {
            atosAgrupados.get(chave).partes.push({
                linha,
                nome: pNome,
                qualidade: Helper.getNodeText(node, "Qualidade"),
                docTipo1: Helper.getNodeText(node, "TipoDocumento1"),
                docNum1: Helper.getNodeText(node, "Numero1")
            });
        }
    }

    // --- PASSO 2: VALIDAÇÃO DAS REGRAS ---
    atosAgrupados.forEach(ato => {
        const loc = `Livro ${ato.livro} Folha ${ato.folha}`;
        const codAto = ato.tipoAtoCesdi;

        // Helper interno para registrar erro no global e no ato específico
        const registrarErro = (linha, parte, msg, tipo, opcoes = undefined) => {
            const erroObj = {
                linhaDoArquivo: linha,
                localizacao: loc,
                nomeDaParte: parte,
                tipoAto: ato.nomeAto,
                mensagemDeErro: msg,
                tipoDeErro: tipo,
                opcoesAceitas: opcoes
            };
            ato.errosDoAto.push(erroObj);
            errosGerais.push(erroObj);
            ato.sucesso = false;
        };

        if (!codAto) {
            registrarErro(ato.linhaBase, null, "TipoAtoCesdi é obrigatório.", "Obrigatoriedade");
            return;
        }

        // Validação de Composição usando o Helper
        const counts = {
            advogados: Helper.countQualidades(ato.partes, 'ADVOGADO(A)'),
            separandos: Helper.countQualidades(ato.partes, 'SEPARANDO(A)'),
            reconciliandos: Helper.countQualidades(ato.partes, 'RECONCILIANDO(A)'),
            divorciandos: Helper.countQualidades(ato.partes, 'DIVORCIANDO(A)'),
            falecidos: Helper.countQualidades(ato.partes, 'FALECIDO(A)'),
            inventariantes: Helper.countQualidades(ato.partes, 'INVENTARIANTE')
        };

        if (!Helper.validarComposicaoAto(codAto, ato.partes, counts)) {
            let msg = "";
            switch (codAto) {
                case '1': msg = "Atos de Separação exigem: 1 ADVOGADO(A) e 2 SEPARANDO(A)."; break;
                case '2': msg = "Atos de Reconciliação exigem: 1 ADVOGADO(A) e 2 RECONCILIANDO(A)."; break;
                case '3':
                case '4': msg = "Atos de Divórcio exigem: 1 ADVOGADO(A) e 2 DIVORCIANDO(A)."; break;
                case '5': msg = "Atos de Inventário exigem: 1 ADVOGADO(A) e 1 FALECIDO(A)."; break;
                case '6':
                case '9': msg = `Atos de ${ato.nomeAto} exigem: 1 ADVOGADO(A) e 1 FALECIDO(A) ou DIVORCIANDO(A).`; break;
                case '8': msg = "Atos de Nomeação de Inventariante exigem: INVENTARIANTE e FALECIDO(A)."; break;
                default:
                    const req = CONST.QUALIDADES_POR_ATO[codAto]?.slice(0, 2).join(' e ') || "partes obrigatórias";
                    msg = `Atos de ${ato.nomeAto} exigem: ${req}.`;
            }
            registrarErro(ato.linhaBase, null, msg, "Regra de Negócio");
        }
        
        // Validação Individual das Partes
        ato.partes.forEach((p, idx) => {
            const permitidas = CONST.QUALIDADES_POR_ATO[codAto] || [];

            // Regra de Acentuação/Caixa Alta
            if (p.qualidade && !permitidas.includes(p.qualidade)) {
                registrarErro(p.linha, p.nome, `Qualidade '${p.qualidade}' inválida.`, "Domínio", permitidas);
            }

            // Validação de CPF
            if (p.docTipo1 === 'CPF' && !Helper.isCpfValido(p.docNum1)) {
                registrarErro(p.linha, p.nome, `CPF (${p.docNum1}) inválido.`, "Validação Matemática");
            }

            // Regra do Primeiro Registro
            if (p.qualidade === "ADVOGADO(A)" && idx === 0) {
                registrarErro(p.linha, p.nome, "O Advogado(a) não pode ser o primeiro registro.", "Regra de Negócio");
            }
        });
    });

    return {
        sucesso: errosGerais.length === 0,
        totalAtos: atosAgrupados.size,
        totalErros: errosGerais.length,
        erros: errosGerais,
        atos: Array.from(atosAgrupados.values()) // Nova lista para o Accordion
    };
};

/**
 * Aplicação de Correções Otimizada
 */
export const aplicarCorrecoesXml = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCesdi");

    // Indexação por linha O(1)
    const nodesByLine = new Map();
    for (let i = 0; i < atosNodeList.length; i++) {
        nodesByLine.set(atosNodeList[i].lineNumber, atosNodeList[i]);
    }

    const mapeamentoTags = {
        'responsavel': 'RespFilhosMenores',
        'dataCasamento': 'DataCasamento',
        'regimeBens': 'RegimeBens',
        'qualidade': 'Qualidade',
        'documento': 'Numero1',
        'nome': 'NomeParte'
    };

    correcoes.forEach(conserto => {
        const node = nodesByLine.get(conserto.linhaDoArquivo);
        if (node) {
            const tagAlvo = mapeamentoTags[conserto.campo] || conserto.campo;
            let tag = node.getElementsByTagName(tagAlvo)[0];

            if (tag) {
                tag.textContent = conserto.novoValor;
            } else {
                const novaTag = xmlDoc.createElement(tagAlvo);
                novaTag.textContent = conserto.novoValor;
                node.appendChild(novaTag);
            }
        }
    });

    return new XMLSerializer().serializeToString(xmlDoc);
};