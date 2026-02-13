import XLSX from 'xlsx';
import { parseCurrency } from '../utils/helpers.js';

const extrairInfoData = (dateStr) => {
    const result = {
        decendio: "Não identificado",
        mes_referencia: null,
        ano_referencia: null
    };

    if (!dateStr || typeof dateStr !== 'string') return result;
    
    const cleanDate = dateStr.trim();
    // Regex para capturar DD/MM/AAAA
    const dateMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    
    if (!dateMatch) return result;
    
    const dia = parseInt(dateMatch[1], 10);
    const mes = parseInt(dateMatch[2], 10);
    const ano = parseInt(dateMatch[3], 10);
    
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return result;

    if (dia >= 1 && dia <= 10) result.decendio = "1º Decêndio";
    else if (dia >= 11 && dia <= 20) result.decendio = "2º Decêndio";
    else if (dia >= 21) result.decendio = "3º Decêndio";

    result.mes_referencia = mes;
    result.ano_referencia = ano;

    return result;
};

export const processarGuiaCsv = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.readFile(filePath, { type: 'file', codepage: 1252 });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (!rows || rows.length === 0) {
                return resolve({ resumo: {}, registros: [] });
            }

            let headerIdx = -1;
            for (let i = 0; i < Math.min(rows.length, 15); i++) {
                const rowStr = rows[i].map(c => String(c).toUpperCase()).join(';');
                if (rowStr.includes('PEDIDO') && rowStr.includes('TIPO ATO')) {
                    headerIdx = i;
                    break;
                }
            }
            if (headerIdx === -1) headerIdx = 0;

            const headerRow = rows[headerIdx].map(cell => String(cell).toUpperCase().trim());
            
            const colMap = {
                pedido: headerRow.findIndex(h => h === 'PEDIDO'), 
                codigoDesc: headerRow.findIndex(h => h.includes('TIPO ATO')),
                qtd: headerRow.findIndex(h => h.includes('QUANTIDADE')),
                // Mapeia colunas de data (Data Pedido ou Data Referência)
                dataPedido: headerRow.findIndex(h => h.includes('DATA PEDIDO')),
                dataRef: headerRow.findIndex(h => h.includes('DATA REFER') || h.includes('REFERENCIA')),
                
                emol: headerRow.findIndex(h => h.includes('TOTAL EMOLUMENTO')),
                base: headerRow.findIndex(h => h.includes('TOTAL BASE')),
                taxa: headerRow.findIndex(h => h.includes('TOTAL TAXA')),
                fundos: headerRow.findIndex(h => h.includes('TOTAL FUNDESP') || h.includes('FUNDOS'))
            };

            const idxFunemp = colMap.fundos + 1;
            const idxFuncomp = colMap.fundos + 2;

            const dataRows = rows.slice(headerIdx + 1);
            const extractedData = [];
            
            // Variável para a data da guia (será preenchida pelo primeiro item válido)
            let dataGuiaStr = null;

            dataRows.forEach(row => {
                if (!row || row.length < 2) return;

                const rawTipoAto = row[colMap.codigoDesc] ? String(row[colMap.codigoDesc]).trim() : '';
                const rawPedido = row[colMap.pedido] ? String(row[colMap.pedido]).trim() : null;

                if (!rawPedido || rawPedido.toUpperCase().includes('TOTAL')) return;

                const codeMatch = rawTipoAto.match(/^(\d{4})/);
                const codigo = codeMatch ? parseInt(codeMatch[1], 10) : null;

                if (!codigo) return; 

                // --- NOVA LÓGICA DE DATA ---
                // Tenta pegar a data deste registo específico se ainda não tivermos a data da guia
                if (!dataGuiaStr) {
                    // Prioridade 1: Coluna Data Referência
                    let valData = (colMap.dataRef !== -1) ? row[colMap.dataRef] : null;
                    
                    // Prioridade 2: Coluna Data Pedido (fallback)
                    if (!valData && colMap.dataPedido !== -1) {
                        valData = row[colMap.dataPedido];
                    }

                    if (valData) {
                        if (typeof valData === 'number') {
                            const dateObj = XLSX.SSF.parse_date_code(valData);
                            const dia = String(dateObj.d).padStart(2, '0');
                            const mes = String(dateObj.m).padStart(2, '0');
                            dataGuiaStr = `${dia}/${mes}/${dateObj.y}`;
                        } else {
                            dataGuiaStr = String(valData).trim();
                        }
                    }
                }
                // ---------------------------

                const extractValueFromText = (text) => {
                    if (!text || typeof text !== 'string') return 0;
                    const match = text.match(/R\$\s*([\d.,]+)/);
                    return match ? parseCurrency(match[1]) : 0;
                };

                const item = {
                    pedido_lote: rawPedido,
                    codigo: codigo,
                    tipo_ato: rawTipoAto,
                    quantidade: row[colMap.qtd] ? parseInt(row[colMap.qtd]) : 0,
                    valor_total_emolumentos: parseCurrency(row[colMap.emol]),
                    valor_total_base_calculo: parseCurrency(row[colMap.base]),
                    valor_total_taxa_judiciaria: parseCurrency(row[colMap.taxa]),
                    valor_total_fundos: parseCurrency(row[colMap.fundos]),
                    valor_funemp: extractValueFromText(row[idxFunemp]),
                    valor_funcomp: extractValueFromText(row[idxFuncomp])
                };

                extractedData.push(item);
            });

            // Calcula informações de data com base no que foi encontrado nos registos
            const infoData = extrairInfoData(dataGuiaStr);

            const sumField = (field) => {
                const total = extractedData.reduce((acc, item) => acc + (item[field] || 0), 0);
                return Math.round(total * 100) / 100;
            };

            const resumo = {
                decendio: infoData.decendio,
                mes_referencia: infoData.mes_referencia,
                ano_referencia: infoData.ano_referencia,
                
                valor_guia: 0, 
                quantidade_total_atos: 0,
                valor_total_emolumentos: sumField('valor_total_emolumentos'),
                valor_total_base_calculo: sumField('valor_total_base_calculo'),
                valor_total_taxa_judiciaria: sumField('valor_total_taxa_judiciaria'),
                valor_total_fundesp: sumField('valor_total_fundos'),
                valor_total_funemp: sumField('valor_funemp'),
                valor_total_funcomp: sumField('valor_funcomp'),
                total_registros: extractedData.length
            };

            resumo.quantidade_total_atos = extractedData.reduce((acc, item) => acc + (item.quantidade || 0), 0);

            resumo.valor_guia = Math.round((
                resumo.valor_total_emolumentos + 
                resumo.valor_total_taxa_judiciaria + 
                resumo.valor_total_fundesp + 
                resumo.valor_total_funemp + 
                resumo.valor_total_funcomp
            ) * 100) / 100;

            resolve({
                resumo,
                registros: extractedData
            });

        } catch (error) {
            console.error('Erro no processamento do CSV:', error);
            reject(error);
        }
    });
};