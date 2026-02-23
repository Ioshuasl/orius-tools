import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import * as CONST from '../utils/rctoConstants.js';

/**
 * Helper: Validação de CPF (11 dígitos numéricos)
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

const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

export const validarXmlRcto = async (filePath) => {
    const erros = [];
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // A especificação foca no Testador, um registro por ato.
    const atosNodeList = xmlDoc.getElementsByTagName("AtoRcto"); 

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoRcto> encontrada." }] };
    }

    const chavesUnicidade = new Set();

    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;

        // Captura de Dados Principais
        const ato = {
            tipoTestamento: getNodeText(node, "tipoTestamento"),
            mne: getNodeText(node, "Mne"),
            cpf: getNodeText(node, "cpf"),
            nome: getNodeText(node, "nome"),
            dataNascimento: getNodeText(node, "dataNascimento"),
            nomeMae: getNodeText(node, "nomeMae"),
            dataTestamento: getNodeText(node, "dataTestamento"),
            livro: getNodeText(node, "livro"),
            livroComp: getNodeText(node, "livroComplemento") || "",
            folha: getNodeText(node, "folha"),
            folhaComp: getNodeText(node, "folhaComplemento") || "",
            tipoDoc: getNodeText(node, "tipoDocumento"),
            docComp: getNodeText(node, "documentoComplemento")
        };

        const loc = `Livro ${ato.livro} Folha ${ato.folha}`;
        const addErro = (msg, tipo) => erros.push({ linha, localizacao: loc, mensagemDeErro: msg, tipoDeErro: tipo });

        // 1. Validação de Unicidade
        const chave = `${ato.livro}-${ato.livroComp}-${ato.folha}-${ato.folhaComp}`;
        if (chavesUnicidade.has(chave)) {
            addErro(`Duplicidade detectada: A combinação Livro/Folha ${chave} já existe no arquivo.`, "Regra de Negócio");
        } else {
            chavesUnicidade.add(chave);
        }

        // 2. Obrigatoriedades Gerais
        if (!ato.tipoTestamento) addErro("O campo tipoTestamento é obrigatório.", "Obrigatoriedade");
        if (!isCpfValido(ato.cpf)) addErro(`CPF (${ato.cpf}) inválido.`, "Validação Matemática");
        if (!ato.nomeMae) addErro("Nome da Mãe é obrigatório.", "Obrigatoriedade");

        // 3. Condicional: Revogação (Tipo 3)
        if (ato.tipoTestamento === '3') {
            const camposRevogacao = ['revogacaoCartorioCns', 'revogacaoDataTestamento', 'revogacaoLivro', 'revogacaoFolha'];
            camposRevogacao.forEach(campo => {
                if (!getNodeText(node, campo)) {
                    addErro(`Campo ${campo} é obrigatório para atos de Revogação.`, "Obrigatoriedade Condicional");
                }
            });
        }

        // 4. Condicional: Tipo Documento "OUTROS"
        if (ato.tipoDoc?.toUpperCase() === 'OUTROS' && !ato.docComp) {
            addErro("O campo documentoComplemento é obrigatório quando o tipoDocumento for 'OUTROS'.", "Obrigatoriedade Condicional");
        }

        // 5. Regra de MNE (e-Notariado)
        // Se houver indicação de ato digital (lógica a ser definida pelo sistema), a MNE é obrigatória.
        if (!ato.mne && ato.mne !== null) {
            // Nota: Se for físico, informar null conforme o manual.
        }
    }

    return { totalAtos: atosNodeList.length, erros, sucesso: erros.length === 0 };
};

export const aplicarCorrecoesRcto = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoRcto");

    // Otimização por Mapa de Linhas para performance O(1)
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