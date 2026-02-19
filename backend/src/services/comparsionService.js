import { parseCurrency } from '../utils/helpers.js';

/**
 * Normaliza valores para comparação.
 * Se for número, fixa em 2 casas. Se for string, converte.
 */
const normalizeValue = (val, isMoney) => {
    if (val === undefined || val === null) return 0;
    if (isMoney) {
        const num = typeof val === 'string' ? parseCurrency(val) : val;
        return parseFloat(num.toFixed(2));
    }
    return val; // Retorna o valor original se não for dinheiro
};

/**
 * Compara dois valores e retorna um objeto de status detalhado
 */
const compareField = (label, valPdf, valCsv, type = 'string') => {
    const isMoney = type === 'money';
    const v1 = normalizeValue(valPdf, isMoney);
    const v2 = normalizeValue(valCsv, isMoney);

    // Lógica de igualdade:
    // Dinheiro: diferença menor que 0.01 centavo
    // Outros: igualdade estrita
    const isEqual = isMoney ? Math.abs(v1 - v2) < 0.01 : v1 == v2;

    return {
        campo: label,
        status: isEqual ? "OK" : "DIVERGENTE",
        valor_sistema: v1, // Fonte confiável (PDF)
        valor_arquivo: v2, // Fonte auditada (CSV)
        diferenca: (isMoney && !isEqual) ? parseFloat((v1 - v2).toFixed(2)) : null
    };
};

export const compararResultados = (jsonPdf, jsonCsv) => {
    const logAuditoria = {
        timestamp: new Date().toISOString(),
        resumo_comparativo: [],
        analise_registros: [],
        estatisticas: {
            total_analisado: 0,
            total_correto: 0,
            total_com_divergencia: 0,
            ausentes_sistema: 0,
            ausentes_arquivo: 0
        }
    };

    // --- 1. COMPARAÇÃO DOS TOTAIS (CABEÇALHO) ---
    
    const resPdf = jsonPdf.resumo || {};
    const resCsv = jsonCsv.resumo || {};

    // Mapa de campos para comparar no resumo
    const mapaResumo = [
        { label: 'Quantidade de Atos', keyPdf: 'quantidade_total', keyCsv: 'quantidade_total_atos', type: 'number' },
        { label: 'Valor da Guia (Total)', keyPdf: 'valor_guia', keyCsv: 'valor_guia', type: 'money' },
        { label: 'Total Emolumentos', keyPdf: 'valor_total_emolumentos', keyCsv: 'valor_total_emolumentos', type: 'money' },
        { label: 'Total Taxa Judiciária', keyPdf: 'valor_taxa_judiciaria', keyCsv: 'valor_total_taxa_judiciaria', type: 'money' },
        { label: 'Total Fundesp', keyPdf: 'valor_fundesp', keyCsv: 'valor_total_fundesp', type: 'money' },
        { label: 'Total Funemp', keyPdf: 'valor_funemp', keyCsv: 'valor_total_funemp', type: 'money' },
        { label: 'Total Funcomp', keyPdf: 'valor_funcomp', keyCsv: 'valor_total_funcomp', type: 'money' }
    ];

    mapaResumo.forEach(map => {
        logAuditoria.resumo_comparativo.push(
            compareField(map.label, resPdf[map.keyPdf], resCsv[map.keyCsv], map.type)
        );
    });

    // --- 2. COMPARAÇÃO DETALHADA DOS REGISTROS ---

    const indexPdf = new Map();
    jsonPdf.registros.forEach(r => indexPdf.set(String(r.pedido_lote).trim(), r));

    const indexCsv = new Map();
    jsonCsv.registros.forEach(r => indexCsv.set(String(r.pedido_lote).trim(), r));

    const todosPedidos = new Set([...indexPdf.keys(), ...indexCsv.keys()]);
    logAuditoria.estatisticas.total_analisado = todosPedidos.size;

    todosPedidos.forEach(pedido => {
        const regPdf = indexPdf.get(pedido);
        const regCsv = indexCsv.get(pedido);

        // Caso 1: Registro existe apenas no PDF (Sistema)
        if (regPdf && !regCsv) {
            logAuditoria.estatisticas.ausentes_arquivo++;
            logAuditoria.analise_registros.push({
                pedido: pedido,
                codigo: regPdf.codigo,
                tipo_ato: regPdf.tipo_ato,
                status_registro: "AUSENTE_NO_CSV",
                detalhes: []
            });
            return;
        }

        // Caso 2: Registro existe apenas no CSV (Arquivo)
        if (!regPdf && regCsv) {
            logAuditoria.estatisticas.ausentes_sistema++;
            logAuditoria.analise_registros.push({
                pedido: pedido,
                codigo: regCsv.codigo,
                tipo_ato: regCsv.tipo_ato,
                status_registro: "AUSENTE_NO_SISTEMA",
                detalhes: []
            });
            return;
        }

        // Caso 3: Existe em ambos - Comparação Campo a Campo
        const comparacoesItem = [
            compareField('Quantidade', regPdf.quantidade, regCsv.quantidade, 'number'),
            compareField('Emolumentos', regPdf.valor_total_emolumentos, regCsv.valor_total_emolumentos, 'money'),
            compareField('Taxa Judiciária', regPdf.valor_total_taxa_judiciaria, regCsv.valor_total_taxa_judiciaria, 'money'),
            compareField('Fundos', regPdf.valor_total_fundos, regCsv.valor_total_fundos, 'money'),
            // Podemos adicionar Código se necessário, mas geralmente a descrição varia muito
            compareField('Código Ato', regPdf.codigo, regCsv.codigo, 'number')
        ];

        // Verifica se houve alguma divergência nesse registro
        const temErro = comparacoesItem.some(c => c.status === "DIVERGENTE");

        if (temErro) {
            logAuditoria.estatisticas.total_com_divergencia++;
        } else {
            logAuditoria.estatisticas.total_correto++;
        }

        logAuditoria.analise_registros.push({
            pedido: pedido,
            codigo: regPdf.codigo, // Usamos o código do PDF como referência
            tipo_ato: regPdf.tipo_ato,
            status_registro: temErro ? "COM_DIVERGENCIA" : "OK",
            detalhes: comparacoesItem // Array contendo TODOS os campos (Certos e Errados)
        });
    });

    // Ordenar para que os erros apareçam primeiro na lista
    logAuditoria.analise_registros.sort((a, b) => {
        if (a.status_registro === 'OK' && b.status_registro !== 'OK') return 1;
        if (a.status_registro !== 'OK' && b.status_registro === 'OK') return -1;
        return 0;
    });

    return logAuditoria;
};