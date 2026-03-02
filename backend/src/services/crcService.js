import fs from 'fs';
import path from 'path';
import libxml from 'libxmljs2'; // Necessário para o Passo 1 (XSD)
import { XMLSerializer, DOMParser } from 'xmldom';
import * as CONST from '../utils/crcConstants.js';
import * as HELPER from '../utils/crcHelper.js';

/**
 * Helper: Captura texto de tags XML lidando com possíveis Namespaces
 */
const getNodeText = (node, tagName) => {
    // Tenta pegar a tag normal ou ignorando o namespace (comum em arquivos do Registro Civil)
    const el = node.getElementsByTagName(tagName)[0] || 
               node.getElementsByTagNameNS("*", tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

/**
 * SERVIÇO DE VALIDAÇÃO E MAPEAMENTO CRC
 */
export const validarXmlCrc = async (filePath) => {
    const erros = [];
    const listaMovimentos = [];
    let totalRegistrosGeral = 0;

    // Padronização do erro conforme cenprotService
    const addErro = (linha, matricula, parte, tipoMov, msg, tipoErro) => {
        erros.push({
            linhaDoArquivo: linha || 0,
            localizacao: `Matrícula ${matricula || 'N/A'} (${tipoMov})`,
            nomeDaParte: parte || "Não identificado",
            tipoAto: tipoMov,
            mensagemDeErro: msg,
            tipoDeErro: tipoErro
        });
    };

    try {
        const xmlString = fs.readFileSync(filePath, 'utf-8');
        const xsdPath = path.resolve(process.cwd(), 'src/schemas/crc26.xsd');

        // --- PASSO 1: VALIDAÇÃO XSD (ESTRUTURAL) ---
        // Se o arquivo XSD não existir, tratamos como erro de estrutura
        if (!fs.existsSync(xsdPath)) {
            throw new Error("Arquivo de schema (crc26.xsd) não encontrado na pasta /schemas.");
        }

        const xsdSource = fs.readFileSync(xsdPath, 'utf-8');
        
        try {
            const xmlDoc = libxml.parseXml(xmlString);
            const xsdDoc = libxml.parseXml(xsdSource);
            if (!xmlDoc.validate(xsdDoc)) {
                xmlDoc.validationErrors.forEach(err => {
                    erros.push({
                        linhaDoArquivo: err.line,
                        localizacao: "Estrutura XML",
                        mensagemDeErro: `Erro no XSD: ${err.message}`,
                        tipoDeErro: "Erro de Esquema XSD"
                    });
                });
                // Se houver erro de XSD, interrompemos para evitar falhas no mapeamento
                return { sucesso: false, totalRegistros: 0, movimentos: [], erros };
            }
        } catch (xsdErr) {
            return { 
                sucesso: false, 
                totalRegistros: 0, 
                erros: [{ mensagemDeErro: `Falha crítica no Parser XSD: ${xsdErr.message}`, tipoDeErro: "Esquema XSD" }] 
            };
        }

        // --- PASSO 2: MAPEAMENTO E REGRAS DE NEGÓCIO (PADRÃO CENPROT) ---
        const parser = new DOMParser();
        const xmlDocDom = parser.parseFromString(xmlString, "text/xml");

        // Blocos de interesse no CRC
        const configuracaoBlocos = [
            { tagPai: "MOVIMENTONASCIMENTOTN", tagFilho: "REGISTRONASCIMENTOINCLUSAO", nome: "Nascimento" },
            { tagPai: "MOVIMENTOCASAMENTOTC", tagFilho: "REGISTROCASAMENTOINCLUSAO", nome: "Casamento" },
            { tagPai: "MOVIMENTOOBITOTO", tagFilho: "REGISTROOBITOINCLUSAO", nome: "Óbito" }
        ];

        for (const bloco of configuracaoBlocos) {
            const paisNodes = xmlDocDom.getElementsByTagName(bloco.tagPai);
            if (paisNodes.length === 0) continue;

            const dadosCategoria = {
                categoria: bloco.nome,
                itens: []
            };

            for (let i = 0; i < paisNodes.length; i++) {
                const registros = paisNodes[i].getElementsByTagName(bloco.tagFilho);
                
                for (let j = 0; j < registros.length; j++) {
                    totalRegistrosGeral++;
                    const nodeReg = registros[j];
                    const linha = nodeReg.lineNumber; // Requer @xmldom/xmldom para funcionar como no seu cenprot
                    
                    const matricula = getNodeText(nodeReg, "MATRICULA");
                    const dataReg = getNodeText(nodeReg, "DATAREGISTRO");
                    
                    // Identifica a parte conforme o tipo de ato
                    let nomeParte = "Não informado";
                    if (bloco.nome === "Nascimento") nomeParte = getNodeText(nodeReg, "NOMEREGISTRADO");
                    else if (bloco.nome === "Casamento") nomeParte = `${getNodeText(nodeReg, "NOMECONJUGE1") || '?'} e ${getNodeText(nodeReg, "NOMECONJUGE2") || '?'}`;
                    else if (bloco.nome === "Óbito") nomeParte = getNodeText(nodeReg, "NOMEFALECIDO");

                    // Validações de Regra de Negócio (Usando seu Helper)
                    if (matricula && !HELPER.validarMatricula(matricula)) {
                        addErro(linha, matricula, nomeParte, bloco.nome, "Matrícula deve conter 32 dígitos.", "Regra de Negócio");
                    }

                    // Verifica se houve algum erro nesta linha específica
                    const temErro = erros.some(e => e.linhaDoArquivo === linha);

                    dadosCategoria.itens.push({
                        linha,
                        matricula,
                        nomeParte,
                        dataRegistro: dataReg,
                        status: temErro ? 'ERRO' : 'OK'
                    });
                }
            }
            if (dadosCategoria.itens.length > 0) {
                listaMovimentos.push(dadosCategoria);
            }
        }

        return {
            totalRegistros: totalRegistrosGeral,
            movimentos: listaMovimentos,
            erros,
            sucesso: erros.length === 0
        };

    } catch (error) {
        return {
            sucesso: false,
            totalRegistros: 0,
            erros: [{ mensagemDeErro: `Erro no processamento: ${error.message}`, tipoDeErro: "Sistema" }]
        };
    }
};

/**
 * APLICAÇÃO DE CORREÇÕES NO XML DO CRC
 * Busca o elemento pela linha do erro e atualiza o valor da tag.
 */
export const corrigirXmlCrc = async (filePath, correcoes) => {
    const xmlString = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Captura todos os elementos para busca por linha
    const todosOsElementos = xmlDoc.getElementsByTagName("*");

    correcoes.forEach(conserto => {
        const { linhaDoArquivo, campo, novoValor } = conserto;

        // Itera pelos elementos para encontrar o que está na linha do erro
        for (let i = 0; i < todosOsElementos.length; i++) {
            const node = todosOsElementos[i];

            // Verificamos se a linha do nó corresponde à linha do erro reportado
            if (node.lineNumber === linhaDoArquivo) {
                // Tenta encontrar a tag específica dentro do nó ou o próprio nó se for a tag alvo
                let targetTag = (node.tagName === campo) 
                    ? node 
                    : (node.getElementsByTagName(campo)[0] || node.getElementsByTagNameNS("*", campo)[0]);

                if (targetTag) {
                    targetTag.textContent = novoValor;
                } else {
                    // Se a tag não existe dentro do nó pai naquela linha, nós a criamos
                    const novaTag = xmlDoc.createElement(campo);
                    novaTag.textContent = novoValor;
                    node.appendChild(novaTag);
                }
                break; // Encontrou a linha, pode passar para a próxima correção
            }
        }
    });

    // Retorna o XML serializado como string
    return new XMLSerializer().serializeToString(xmlDoc);
};