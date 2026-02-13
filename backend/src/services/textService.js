import { exec } from 'child_process';
import { parseCurrency } from '../utils/helpers.js';

const PDFTOTEXT_PATH = process.env.PDFTOTEXT_PATH || 
    (process.platform === 'win32' ? 'C:\\poppler\\Library\\bin\\pdftotext.exe' : 'pdftotext');

const findFooterValue = (text, regex) => {
    const match = text.match(regex);
    return match ? parseCurrency(match[1]) : 0.0;
};

export const processarGuiaSistema = (filePath, referenceMap) => {
    return new Promise((resolve, reject) => {
        const command = `"${PDFTOTEXT_PATH}" -layout -enc UTF-8 "${filePath}" -`;

        exec(command, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) return reject(error);

            const lines = stdout.split('\n');
            const registros = [];
            let currentRecord = null;
            let currentStatus = "Desconhecido";

            const startRecordRegex = /^\s*(\d{7,10})\s+(\d{3,5})\b/;
            const valuesRegex = /(-?\d+)\s+(-?[0-9.,]+)\s+(-?[0-9.,]+)\s+(-?[0-9.,]+)\s+(-?[0-9.,]+)\s+(\d+)\s+(-?[0-9.,]+)\s*$/;

            lines.forEach((line) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                if (trimmedLine.match(/^Itens\s+Isentados/i)) currentStatus = "Isento";
                else if (trimmedLine.match(/Situaç[ãa]o:\s*Utilizado/i)) currentStatus = "Utilizado";
                else if (trimmedLine.match(/Situaç[ãa]o:\s*Inutilizado/i)) currentStatus = "Inutilizado";

                const startMatch = line.match(startRecordRegex);
                if (startMatch) {
                    const codigo = parseInt(startMatch[2], 10);
                    let descricao = referenceMap.has(codigo) ? referenceMap.get(codigo) : "Descrição não mapeada";

                    currentRecord = {
                        situacao: currentStatus,
                        pedido_lote: startMatch[1],
                        codigo: codigo,
                        tipo_ato: descricao
                    };
                }

                if (currentRecord) {
                    const valMatch = trimmedLine.match(valuesRegex);
                    if (valMatch) {
                        currentRecord.quantidade = parseInt(valMatch[1], 10);
                        currentRecord.valor_total_emolumentos = parseCurrency(valMatch[2]);
                        currentRecord.valor_total_taxa_judiciaria = parseCurrency(valMatch[3]);
                        currentRecord.valor_total_fundos = parseCurrency(valMatch[4]);
                        currentRecord.valor_total_taxa_iss = parseCurrency(valMatch[5]);
                        currentRecord.quantidade_atos_gratuitos = parseInt(valMatch[6], 10);
                        currentRecord.valor_total_atos_gratuitos = parseCurrency(valMatch[7]);

                        registros.push(currentRecord);
                        currentRecord = null;
                    }
                }
            });

            const totais = {
                valor_guia: findFooterValue(stdout, /Total\s+Guia\s+Corregedoria\s*\(GRS\):\s*([0-9.]+,[0-9]{2})/i),
                valor_total_emolumentos: findFooterValue(stdout, /Totalizador\s+Geral\s*\(Base\s+de\s+c[áa]lculo\)\s*([0-9.]+,[0-9]{2})/i),
                valor_taxa_judiciaria: findFooterValue(stdout, /Taxa\s+Judici[áa]ria:\s*([0-9.]+,[0-9]{2})/i),
                valor_fundesp: findFooterValue(stdout, /FUNDESP\s*\(10%\)\s*([0-9.]+,[0-9]{2})/i),
                valor_funemp: findFooterValue(stdout, /FUNEMP\s*\(3%\):\s*([0-9.]+,[0-9]{2})/i),
                valor_funcomp: findFooterValue(stdout, /FUNCOMP\s*\(6%\):\s*([0-9.]+,[0-9]{2})/i),
                valor_iss: findFooterValue(stdout, /ISSQN\s*5%:\s*([0-9.]+,[0-9]{2})/i)
            };

            resolve({
                resumo: {
                    valor_guia: parseFloat(totais.valor_guia.toFixed(2)),
                    valor_total_emolumentos: parseFloat(totais.valor_total_emolumentos.toFixed(2)),
                    valor_taxa_judiciaria: parseFloat(totais.valor_taxa_judiciaria.toFixed(2)),
                    valor_fundesp: parseFloat(totais.valor_fundesp.toFixed(2)),
                    valor_funemp: parseFloat(totais.valor_funemp.toFixed(2)),
                    valor_funcomp: parseFloat(totais.valor_funcomp.toFixed(2)),
                    valor_iss: parseFloat(totais.valor_iss.toFixed(2))
                },
                registros: registros
            });
        });
    });
};