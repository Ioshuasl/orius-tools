import { parseCurrency } from '../utils/helpers.js';

/**
 * Normaliza valores para comparação, garantindo precisão decimal para moedas.
 */
const normalizeValue = (val, isMoney) => {
    if (val === undefined || val === null) return 0;
    if (isMoney) {
        // Se for string (ex: do CSV), converte. Se já for número, apenas garante as casas decimais.
        const num = typeof val === 'string' ? parseCurrency(val) : val;
        return parseFloat(num.toFixed(2));
    }
    return val;
};

/**
 * Compara dois campos e retorna um objeto de status de auditoria.
 */
const compareField = (label, valSistema, valArquivo, type = 'string') => {
    const isMoney = type === 'money';
    const v1 = normalizeValue(valSistema, isMoney);
    const v2 = normalizeValue(valArquivo, isMoney);

    // Para moedas, aceitamos uma margem de erro de 0.01 para evitar problemas de arredondamento
    const isEqual = isMoney ? Math.abs(v1 - v2) < 0.01 : v1 == v2;

    return {
        campo: label,
        status: isEqual ? "OK" : "DIVERGENTE",
        valor_sistema: v1, 
        valor_arquivo: v2, 
        diferenca: isMoney ? parseFloat((v1 - v2).toFixed(2)) : null
    };
};

/**
 * Lógica principal de comparação entre os dados extraídos do PDF (Sistema) 
 * e os dados extraídos do CSV (Arquivo).
 */
export const compararResultados = (resultadoPdf, resultadoCsv) => {
    const logAuditoria = {
        timestamp: new Date().toISOString(),
        estatisticas: {
            total_atos_sistema: resultadoPdf.resumo.quantidade_total,
            total_atos_arquivo: resultadoCsv.resumo.quantidade_total_atos,
            total_correto: 0,
            total_com_divergencia: 0
        },
        resumo_comparativo: [],
        analise_registros: []
    };

    const pdfRes = resultadoPdf.resumo;
    const csvRes = resultadoCsv.resumo;

    // 1. Comparação do Resumo Geral (Cabeçalho da Guia)
    logAuditoria.resumo_comparativo = [
        compareField('Quantidade Total de Atos', pdfRes.quantidade_total, csvRes.quantidade_total_atos, 'number'),
        compareField('Valor Total Emolumentos', pdfRes.valor_total_emolumentos, csvRes.valor_total_emolumentos, 'money'),
        compareField('Valor Taxa Judiciária', pdfRes.valor_taxa_judiciaria, csvRes.valor_total_taxa_judiciaria, 'money'),
        // Comparação unificada utilizando o novo campo totalizador de fundos
        compareField('Valor Total dos Fundos', pdfRes.valor_total_fundos, csvRes.valor_total_fundos, 'money')
    ];

    // 2. Mapeamento dos registros do CSV para busca rápida (O(1)) pelo Pedido/Lote
    const mapCsv = new Map();
    resultadoCsv.registros.forEach(reg => {
        if (reg.pedido_lote) {
            mapCsv.set(String(reg.pedido_lote), reg);
        }
    });

    // 3. Comparação Linha a Linha
    resultadoPdf.registros.forEach(regPdf => {
        const pedido = String(regPdf.pedido_lote);
        const regCsv = mapCsv.get(pedido);

        if (!regCsv) {
            logAuditoria.analise_registros.push({
                pedido,
                status_registro: "NAO_ENCONTRADO_NO_CSV",
                tipo_ato: regPdf.tipo_ato,
                valor_emol_sistema: regPdf.valor_total_emolumentos
            });
            logAuditoria.estatisticas.total_com_divergencia++;
            return;
        }

        const comparacoesItem = [
            compareField('Quantidade', regPdf.quantidade, regCsv.quantidade, 'number'),
            compareField('Emolumentos', regPdf.valor_total_emolumentos, regCsv.valor_total_emolumentos, 'money'),
            compareField('Taxa Judiciária', regPdf.valor_total_taxa_judiciaria, regCsv.valor_total_taxa_judiciaria, 'money'),
            // Comparação do total de fundos calculado para cada item específico
            compareField('Total Fundos', regPdf.valor_total_fundos, regCsv.valor_total_fundos, 'money')
        ];

        const temErro = comparacoesItem.some(c => c.status === "DIVERGENTE");
        
        if (temErro) {
            logAuditoria.estatisticas.total_com_divergencia++;
        } else {
            logAuditoria.estatisticas.total_correto++;
        }

        logAuditoria.analise_registros.push({
            pedido,
            codigo: regPdf.codigo,
            tipo_ato: regPdf.tipo_ato,
            status_registro: temErro ? "COM_DIVERGENCIA" : "OK",
            detalhes: comparacoesItem
        });
    });

    // 4. Verificação de Registros Sobressalentes no CSV (opcional, mas recomendado)
    const pedidosPdf = new Set(resultadoPdf.registros.map(r => String(r.pedido_lote)));
    resultadoCsv.registros.forEach(regCsv => {
        if (regCsv.pedido_lote && !pedidosPdf.has(String(regCsv.pedido_lote))) {
            logAuditoria.analise_registros.push({
                pedido: regCsv.pedido_lote,
                status_registro: "NAO_ENCONTRADO_NO_SISTEMA_PDF",
                tipo_ato: regCsv.tipo_ato,
                valor_emol_arquivo: regCsv.valor_total_emolumentos
            });
        }
    });

    return logAuditoria;
};