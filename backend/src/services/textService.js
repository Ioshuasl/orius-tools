import { exec } from 'child_process';
import { parseCurrency } from '../utils/helpers.js';
import { calcularFundos } from '../utils/calcularFundos.js'; // Importação da função centralizada

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
                        valor_total_atos_gratuitos: 0,
                        // Novo atributo detalhado por item
                        detalhamento_fundos: {} 
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
                const emolumentos = parseCurrency(match[2]);
                // Aplicando a função no nível do registro individual
                const calculo = calcularFundos(emolumentos);

                record.quantidade = parseInt(match[1], 10);
                record.valor_total_emolumentos = emolumentos;
                record.valor_total_taxa_judiciaria = parseCurrency(match[3]);
                record.valor_total_fundos = calculo.total;
                record.detalhamento_fundos = calculo.detalhado;
                record.valor_total_taxa_iss = parseCurrency(match[5]);
                record.valor_total_atos_gratuitos = parseCurrency(match[6]);
                record.valuesFound = true;
            }

            // --- Resumo Consolidado ---
            
            const somaEmolumentos = registros.reduce((acc, r) => acc + r.valor_total_emolumentos, 0);
            const somaTaxaJudiciaria = registros.reduce((acc, r) => acc + r.valor_total_taxa_judiciaria, 0);
            const somaISS = registros.reduce((acc, r) => acc + r.valor_total_taxa_iss, 0);

            // Uso da função calcularFundos para o resumo geral
            const resumoCalculoFundos = calcularFundos(somaEmolumentos);

            const footerText = stdout.substring(stdout.lastIndexOf("Totais:"));
            const matches = footerText.match(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g);
            
            let valorGuia = 0;
            if (matches && matches.length >= 5) {
                const reverseMatches = matches.reverse();
                valorGuia = parseCurrency(reverseMatches.find(v => {
                    const n = parseCurrency(v);
                    // Lógica para encontrar o valor da guia (GRS) na pilha do PDF
                    return n > (resumoCalculoFundos.detalhado.fundesp + somaTaxaJudiciaria);
                }) || "0");
            }

            resolve({
                resumo: {
                    quantidade_total: registros.reduce((acc, r) => acc + r.quantidade, 0),
                    valor_guia: valorGuia,
                    valor_total_emolumentos: Number(somaEmolumentos.toFixed(2)),
                    valor_taxa_judiciaria: Number(somaTaxaJudiciaria.toFixed(2)),
                    // Substituindo variáveis avulsas pelo objeto detalhado
                    detalhamento_fundos: resumoCalculoFundos.detalhado,
                    valor_total_fundos: resumoCalculoFundos.total,
                    valor_iss: Number(somaISS.toFixed(2))
                },
                registros: registros
            });
        });
    });
};