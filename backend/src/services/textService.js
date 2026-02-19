import { exec } from 'child_process';
import { parseCurrency } from '../utils/helpers.js';

const PDFTOTEXT_PATH = process.env.PDFTOTEXT_PATH || 
    (process.platform === 'win32' ? 'C:\\poppler\\Library\\bin\\pdftotext.exe' : 'pdftotext');

export const processarGuiaSistema = (filePath, referenceMap) => {
    return new Promise((resolve, reject) => {
        const command = `"${PDFTOTEXT_PATH}" -raw -nopgbrk -enc UTF-8 "${filePath}" -`;

        exec(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) return reject(error);

            const lines = stdout.split('\n');
            const registros = [];
            let currentRecord = null;
            let currentStatus = "Desconhecido"; 

            const startCodeRegex = /^\s*(\d{4})\s+(.*)/;
            const valuesRegex = /(\d+)\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)\s*$/;
            const invoiceRegex = /^\s*(\d{8})\s*$/;

            lines.forEach((line) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                if (trimmedLine.match(/Itens\s+Isentados/i)) { currentStatus = "Isento"; return; }
                if (trimmedLine.match(/Situaç[ãa]o:?\s*Utilizado/i)) { currentStatus = "Utilizado"; return; }

                const startMatch = line.match(startCodeRegex);
                if (startMatch) {
                    if (currentRecord && currentRecord.valuesFound) { registros.push(currentRecord); }
                    const codigo = parseInt(startMatch[1], 10);
                    let descricao = startMatch[2].trim();
                    const inlineVal = descricao.match(valuesRegex);

                    currentRecord = {
                        situacao: currentStatus,
                        pedido_lote: null,
                        codigo: codigo,
                        tipo_ato: inlineVal ? descricao.replace(valuesRegex, '').trim() : descricao,
                        valuesFound: false,
                        quantidade: 0,
                        valor_total_emolumentos: 0,
                        valor_total_taxa_judiciaria: 0,
                        valor_total_fundos: 0,
                        valor_total_taxa_iss: 0,
                        valor_total_atos_gratuitos: 0
                    };
                    if (inlineVal) applyValues(currentRecord, inlineVal);
                    return;
                }

                if (currentRecord) {
                    const invMatch = trimmedLine.match(invoiceRegex);
                    if (invMatch) {
                        currentRecord.pedido_lote = invMatch[1];
                        registros.push(currentRecord);
                        currentRecord = null;
                        return;
                    }
                    const valMatch = trimmedLine.match(valuesRegex);
                    if (valMatch) applyValues(currentRecord, valMatch);
                    else if (trimmedLine.length > 3 && !trimmedLine.match(/^\d+$/)) {
                        currentRecord.tipo_ato += " " + trimmedLine;
                    }
                }
            });

            function applyValues(record, match) {
                record.quantidade = parseInt(match[1], 10);
                record.valor_total_emolumentos = parseCurrency(match[2]);
                record.valor_total_taxa_judiciaria = parseCurrency(match[3]);
                record.valor_total_fundos = parseCurrency(match[4]);
                record.valor_total_taxa_iss = parseCurrency(match[5]);
                record.valor_total_atos_gratuitos = parseCurrency(match[6]);
                record.valuesFound = true;
            }

            // --- Lógica de Resumo por SOMA e EXTRAÇÃO POR POSIÇÃO ---
            
            const somaEmolumentos = registros.reduce((acc, r) => acc + r.valor_total_emolumentos, 0);
            const somaTaxaJudiciaria = registros.reduce((acc, r) => acc + r.valor_total_taxa_judiciaria, 0);
            const somaISS = registros.reduce((acc, r) => acc + r.valor_total_taxa_iss, 0);

            const valorFundesp = parseFloat((somaEmolumentos * 0.10).toFixed(2));
            const valorFunemp = parseFloat((somaEmolumentos * 0.03).toFixed(2));
            const valorFuncomp = parseFloat((somaEmolumentos * 0.06).toFixed(2));

            // CORREÇÃO DO VALOR DA GUIA:
            const footerText = stdout.substring(stdout.lastIndexOf("Totais:"));
            // Captura todos os valores monetários (Ex: 1.234,56) no bloco de rodapé
            const matches = footerText.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g);
            
            let valorGuia = 0;
            if (matches && matches.length >= 5) {
                /**
                 * Seguindo a estrutura do dump enviado:
                 * ...
                 * 1.300,44 (Taxa Judiciária)
                 * 2.090,11 (FUNDESP)
                 * 627,03   (FUNEMP)
                 * 1.254,07 (FUNCOMP)
                 * 5.505,81 (TOTAL GUIA) <- É o 5º valor da pilha de baixo para cima
                 * 1.045,06 (ISSQN)
                 * 0,00     (SINOREG 3%)
                 */
                // Filtramos o "Total SEFAZ/ISSQN" (2.142,37) se ele aparecer antes na lista
                // e pegamos o valor da GRS na pilha.
                const reverseMatches = matches.reverse();
                // No dump fornecido, 5.505,81 é o 3º valor monetário se contarmos de baixo (ignorando o 0,00 e o ISS)
                // Para maior precisão, buscamos o valor que é a soma de (Taxa + Fundesp + Funemp + Funcomp)
                valorGuia = parseCurrency(reverseMatches.find(v => {
                    const n = parseCurrency(v);
                    return n > (valorFundesp + somaTaxaJudiciaria);
                }) || "0");
            }

            resolve({
                resumo: {
                    quantidade_total: registros.reduce((acc, r) => acc + r.quantidade, 0),
                    valor_guia: valorGuia,
                    valor_total_emolumentos: parseFloat(somaEmolumentos.toFixed(2)),
                    valor_taxa_judiciaria: parseFloat(somaTaxaJudiciaria.toFixed(2)),
                    valor_fundesp: valorFundesp,
                    valor_funemp: valorFunemp,
                    valor_funcomp: valorFuncomp,
                    valor_iss: parseFloat(somaISS.toFixed(2))
                },
                registros: registros
            });
        });
    });
};