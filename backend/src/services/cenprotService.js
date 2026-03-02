import fs from 'fs';
import { DOMParser } from 'xmldom';

/**
 * Mapeamento de tipos de ocorrência CENPROT
 */
const TIPOS_OCORRENCIA = {
    "0": "Apontamento",
    "1": "Cancelado",
    "A": "Cancelado",
    "2": "Protestado",
    "3": "Outros"
};

/**
 * Helper: Captura texto de tags XML
 */
const getNodeText = (node, tagName) => {
    const el = node.getElementsByTagName(tagName)[0];
    return el && el.textContent ? el.textContent.trim() : null;
};

/**
 * SERVIÇO DE VALIDAÇÃO E MAPEAMENTO CENPROT
 */
export const validarXmlCenprot = async (filePath) => {
    const erros = [];
    const listaApresentantes = []; // Para o seu Frontend "bonito"
    let totalTitulosGeral = 0;

    const addErro = (linha, protocolo, devedor, apresentante, msg, tipo, ocorrencia) => {
        const nomeTipoAto = TIPOS_OCORRENCIA[ocorrencia] || `Ocorrência ${ocorrencia}`;
        erros.push({
            linhaDoArquivo: linha,
            localizacao: `Protocolo ${protocolo} (Apresentante: ${apresentante})`,
            nomeDaParte: devedor || "Não informado",
            tipoAto: nomeTipoAto,
            mensagemDeErro: msg,
            tipoDeErro: tipo
        });
    };

    try {
        const xmlString = fs.readFileSync(filePath, 'utf-8');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        const apresentantesNodes = xmlDoc.getElementsByTagName("apresentante");

        for (let i = 0; i < apresentantesNodes.length; i++) {
            const nodeApres = apresentantesNodes[i];
            
            // Dados do Apresentante para o Frontend
            const dadosApresentante = {
                nome: getNodeText(nodeApres, "nome") || "Apresentante não identificado",
                cnpj: getNodeText(nodeApres, "CNPJ"),
                titulos: []
            };

            const titulosNodes = nodeApres.getElementsByTagName("titulo");
            totalTitulosGeral += titulosNodes.length;

            for (let j = 0; j < titulosNodes.length; j++) {
                const nodeTitulo = titulosNodes[j];
                const linha = nodeTitulo.lineNumber;
                
                const protocolo = getNodeText(nodeTitulo, "protocolo");
                const ocorrencia = getNodeText(nodeTitulo, "ocorrencia");
                const instrumento = getNodeText(nodeTitulo, "instrumento_eletronico");
                const valor = getNodeText(nodeTitulo, "valor");
                const numeroDoc = getNodeText(nodeTitulo, "numero_titulo");
                
                const devedorNode = nodeTitulo.getElementsByTagName("devedor")[0];
                const nomeDevedor = devedorNode ? getNodeText(devedorNode, "nome") : "Desconhecido";

                // Verifica se há erro de assinatura
                const temErroChilkat = instrumento && instrumento.includes("ChilkatLog");

                if (temErroChilkat) {
                    addErro(
                        linha, 
                        protocolo, 
                        nomeDevedor, 
                        dadosApresentante.nome,
                        "Erro técnico de assinatura (Chilkat). O título precisa ser assinado novamente no sistema legado.", 
                        "Erro de Assinatura", 
                        ocorrencia
                    );
                }

                // Monta o objeto do título para exibição no Frontend
                dadosApresentante.titulos.push({
                    linha,
                    protocolo,
                    numeroDoc,
                    valor,
                    devedor: nomeDevedor,
                    tipoAto: TIPOS_OCORRENCIA[ocorrencia] || ocorrencia,
                    status: temErroChilkat ? 'ERRO' : 'OK',
                    mensagemErro: temErroChilkat ? "Erro na assinatura digital" : null
                });
            }

            listaApresentantes.push(dadosApresentante);
        }

        return { 
            totalTitulos: totalTitulosGeral, 
            apresentantes: listaApresentantes, // Lista agrupada para o UI
            erros, 
            sucesso: erros.length === 0 
        };

    } catch (error) {
        return { 
            sucesso: false, 
            totalTitulos: 0, 
            erros: [{ mensagemDeErro: `Erro no processamento: ${error.message}` }] 
        };
    }
};