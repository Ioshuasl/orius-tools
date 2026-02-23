import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import * as CONST from '../utils/cesdiConstants.js';

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
 * Helper: Captura texto de tags (Suporta XML Legado)
 */
const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

/**
 * Função Principal de Validação CESDI
 */
export const validarXmlCesdi = async (filePath) => {
    const erros = [];
    const atosAgrupados = new Map();

    const addErro = (linha, local, parte, msg, tipo, codAto = null, opcoes = undefined) => {
        // Busca o rótulo amigável nas constantes
        const nomeAmigavelAto = codAto ? (CONST.TIPOS_ATO_CESDI[codAto] || `Ato ${codAto}`) : "Ato não identificado";
        
        erros.push({
            linhaDoArquivo: linha || '?',
            localizacao: local,
            nomeDaParte: parte || null,
            tipoAtoCesdi: nomeAmigavelAto, // Rótulo amigável (Ex: "Retificação")
            mensagemDeErro: msg,
            tipoDeErro: tipo,
            opcoesAceitas: opcoes
        });
    };

    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Captura registros do DataSet legado
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCesdi");

    if (!atosNodeList.length) {
        return { sucesso: false, totalAtos: 0, erros: [{ mensagemDeErro: "Nenhuma tag <AtoCesdi> encontrada." }] };
    }

    // --- PASSO 1: AGRUPAMENTO (Chave de Unicidade) ---
    for (let i = 0; i < atosNodeList.length; i++) {
        const node = atosNodeList[i];
        const linha = node.lineNumber;
        
        const livro = getNodeText(node, "Livro");
        const folha = getNodeText(node, "Folha");
        const livroComp = getNodeText(node, "LivroComplemento") || "";
        const folhaComp = getNodeText(node, "FolhaComplemento") || "";
        const chave = `${livro}-${livroComp}-${folha}-${folhaComp}`;

        if (!atosAgrupados.has(chave)) {
            atosAgrupados.set(chave, {
                linha,
                tipoAtoCesdi: getNodeText(node, "TipoAtoCesdi"), // Código original (Ex: '7')
                data: getNodeText(node, "DataAto"),
                livro, livroComp, folha, folhaComp,
                dataCasamento: getNodeText(node, "DataCasamento"),
                regimeBens: getNodeText(node, "RegimeBens"),
                responsavel: getNodeText(node, "RespFilhosMenores"),
                partes: []
            });
        }

        const ato = atosAgrupados.get(chave);
        const pNome = getNodeText(node, "NomeParte");
        if (pNome) {
            ato.partes.push({
                linha,
                nome: pNome,
                qualidade: getNodeText(node, "Qualidade"),
                conjugeTipo: getNodeText(node, "Conjuge"),
                docTipo1: getNodeText(node, "TipoDocumento1"),
                docNum1: getNodeText(node, "Numero1"),
                uf1: getNodeText(node, "Uf1"),
                dataNasc: getNodeText(node, "DataNascimento")
            });
        }
    }

    // --- PASSO 2: VALIDAÇÃO DAS REGRAS (CESDI.MD) ---
    atosAgrupados.forEach(ato => {
        const loc = `Livro ${ato.livro} Folha ${ato.folha}`;
        const codAto = ato.tipoAtoCesdi;
        
        // 2.1. Obrigatoriedades de Cabeçalho
        if (!codAto) addErro(ato.linha, loc, null, "TipoAtoCesdi é obrigatório.", "Obrigatoriedade");

        const isDivorcioSep = ['1', '3', '4'].includes(codAto); // Separação e Divórcio
        if (isDivorcioSep && !ato.responsavel) {
            const opcoesResp = CONST.RESPONSAVEL_MENORES
            if (!ato.dataCasamento) addErro(ato.linha, loc, null, "Data de Casamento obrigatória para este ato.", "Obrigatoriedade", codAto);
            if (!ato.regimeBens) addErro(ato.linha, loc, null, "Regime de Bens é obrigatório.", "Obrigatoriedade", codAto, Object.values(CONST.REGIMES_BENS_CESDI));
            if (!ato.responsavel) addErro(ato.linha, loc, null, "Responsável pelos menores obrigatório.", "Obrigatoriedade", codAto, opcoesResp);
        }

        // 2.2. Mínimo de Partes
        const minPartes = CONST.MINIMO_PARTES_POR_ATO[codAto] || CONST.MINIMO_PARTES_POR_ATO.DEFAULT;
        if (ato.partes.length < minPartes) {
            addErro(ato.linha, loc, null, `Este tipo de ato exige no mínimo ${minPartes} partes.`, "Regra de Negócio", codAto);
        }

        // 2.3. Validação das Partes e Qualidades
        ato.partes.forEach((p, idx) => {
            const qualidadeLimpa = p.qualidade?.replace(/\(A\)/g, '').trim();
            const isAdvogado = qualidadeLimpa?.toUpperCase() === "ADVOGADO";

            // Cruzamento estrito de Qualidade x Tipo de Ato
            const permitidas = CONST.QUALIDADES_POR_ATO[codAto] || [];
            if (!permitidas.some(q => q.toUpperCase() === qualidadeLimpa?.toUpperCase())) {
                addErro(p.linha, loc, p.nome, `Qualidade '${p.qualidade}' inválida para este ato.`, "Domínio", codAto, permitidas);
            }

            // Regras para Advogado
            if (isAdvogado) {
                if (idx === 0) addErro(p.linha, loc, p.nome, "O Advogado não pode ser o primeiro registro do ato.", "Regra de Negócio", codAto);
                if (p.dataNasc) addErro(p.linha, loc, p.nome, "Data de nascimento não permitida para Advogados.", "Formato", codAto);
            }

            // Validação de Documentos
            if (p.docTipo1 === 'CPF' && !isCpfValido(p.docNum1)) {
                addErro(p.linha, loc, p.nome, `CPF (${p.docNum1}) é matematicamente inválido.`, "Validação Matemática", codAto);
            }
            if (p.docTipo1 === 'OAB' && !p.uf1) {
                addErro(p.linha, loc, p.nome, "UF é obrigatória para OAB.", "Obrigatoriedade", codAto);
            }
        });
    });

    return { totalAtos: atosAgrupados.size, erros, sucesso: erros.length === 0 };
};

export const aplicarCorrecoesXml = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const atosNodeList = xmlDoc.getElementsByTagName("AtoCesdi");

    correcoes.forEach(conserto => {
        for (let i = 0; i < atosNodeList.length; i++) {
            const node = atosNodeList[i];
            
            if (node.lineNumber === conserto.linhaDoArquivo) {
                // MAPEAMENTO FRONTEND -> TAG XML LEGADA (Delphi)
                const mapeamento = {
                    'responsavel': 'RespFilhosMenores',
                    'dataCasamento': 'DataCasamento',
                    'regimeBens': 'RegimeBens',
                    'filhosMaiores': 'QuantidadeFilhosMaiores',
                    'filhosMenores': 'QuantidadeFilhosMenores',
                    'qualidade': 'Qualidade',
                    'documento': 'Numero1',
                    'nome': 'NomeParte'
                };

                const tagAlvo = mapeamento[conserto.campo] || conserto.campo;
                let tag = node.getElementsByTagName(tagAlvo)[0];
                
                if (tag) {
                    tag.textContent = conserto.novoValor;
                } else {
                    // Cria a tag se estiver ausente no XML original
                    const novaTag = xmlDoc.createElement(tagAlvo);
                    novaTag.textContent = conserto.novoValor;
                    node.appendChild(novaTag);
                }
            }
        }
    });

    return new XMLSerializer().serializeToString(xmlDoc);
};