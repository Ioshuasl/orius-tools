import XLSX from 'xlsx';
import { parseCurrency } from '../utils/helpers.js';
import { calcularFundos } from '../utils/calcularFundos.js'; // Importação solicitada

const extrairInfoData = (dateStr) => {
    const result = {
        decendio: "Não identificado",
        mes_referencia: null,
        ano_referencia: null
    };

    if (!dateStr || typeof dateStr !== 'string') return result;
    
    const cleanDate = dateStr.trim();
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
                dataPedido: headerRow.findIndex(h => h.includes('DATA PEDIDO')),
                dataRef: headerRow.findIndex(h => h.includes('DATA REFER') || h.includes('REFERENCIA')),
                emol: headerRow.findIndex(h => h.includes('TOTAL EMOLUMENTO')),
                base: headerRow.findIndex(h => h.includes('TOTAL BASE')),
                taxa: headerRow.findIndex(h => h.includes('TOTAL TAXA'))
            };

            const dataRows = rows.slice(headerIdx + 1);
            const extractedData = [];
            let dataGuiaStr = null;

            dataRows.forEach(row => {
                if (!row || row.length < 2) return;

                const rawTipoAto = row[colMap.codigoDesc] ? String(row[colMap.codigoDesc]).trim() : '';
                const rawPedido = row[colMap.pedido] ? String(row[colMap.pedido]).trim() : null;

                if (!rawPedido || rawPedido.toUpperCase().includes('TOTAL')) return;

                const codeMatch = rawTipoAto.match(/^(\d{4})/);
                const codigo = codeMatch ? parseInt(codeMatch[1], 10) : null;

                if (!codigo) return; 

                if (!dataGuiaStr) {
                    let valData = (colMap.dataRef !== -1) ? row[colMap.dataRef] : null;
                    if (!valData && colMap.dataPedido !== -1) valData = row[colMap.dataPedido];

                    if (valData) {
                        if (typeof valData === 'number') {
                            const dateObj = XLSX.SSF.parse_date_code(valData);
                            dataGuiaStr = `${String(dateObj.d).padStart(2, '0')}/${String(dateObj.m).padStart(2, '0')}/${dateObj.y}`;
                        } else {
                            dataGuiaStr = String(valData).trim();
                        }
                    }
                }

                const baseCalculo = parseCurrency(row[colMap.base]);
                // APLICAÇÃO DA NOVA FUNÇÃO NO ITEM
                const fundosCalculados = calcularFundos(baseCalculo);

                const item = {
                    pedido_lote: rawPedido,
                    codigo: codigo,
                    tipo_ato: rawTipoAto,
                    quantidade: row[colMap.qtd] ? parseInt(row[colMap.qtd]) : 0,
                    valor_total_emolumentos: parseCurrency(row[colMap.emol]),
                    valor_total_base_calculo: baseCalculo,
                    valor_total_taxa_judiciaria: parseCurrency(row[colMap.taxa]),
                    // Novos atributos detalhados vindo da função
                    fundos: fundosCalculados.detalhado,
                    valor_total_fundos: fundosCalculados.total
                };

                extractedData.push(item);
            });

            const infoData = extrairInfoData(dataGuiaStr);
            const totalBaseGeral = extractedData.reduce((acc, item) => acc + item.valor_total_base_calculo, 0);
            
            // APLICAÇÃO DA NOVA FUNÇÃO NO RESUMO (Sobre o total da base)
            const resumoFundos = calcularFundos(totalBaseGeral);

            const resumo = {
                decendio: infoData.decendio,
                mes_referencia: infoData.mes_referencia,
                ano_referencia: infoData.ano_referencia,
                total_registros: extractedData.length,
                quantidade_total_atos: extractedData.reduce((acc, item) => acc + item.quantidade, 0),
                
                valor_total_emolumentos: Number(extractedData.reduce((acc, item) => acc + item.valor_total_emolumentos, 0).toFixed(2)),
                valor_total_base_calculo: Number(totalBaseGeral.toFixed(2)),
                valor_total_taxa_judiciaria: Number(extractedData.reduce((acc, item) => acc + item.valor_total_taxa_judiciaria, 0).toFixed(2)),
                
                // Atributos de resumo atualizados
                detalhamento_fundos: resumoFundos.detalhado,
                valor_total_fundos: resumoFundos.total
            };

            // Cálculo do Valor Total da Guia (Emolumentos + Taxa + Soma de todos os Fundos)
            resumo.valor_total_guia = Number((
                resumo.valor_total_emolumentos + 
                resumo.valor_total_taxa_judiciaria + 
                resumo.valor_total_fundos
            ).toFixed(2));

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