import XLSX from 'xlsx';

// Mapeamento de Sistemas
const SYSTEM_MAP = [
    { keys: ['TABELIONATO DE NOTAS', 'TABELIÃES DE NOTAS'], system: 'TABELIONATO DE NOTAS' },
    { keys: ['REGISTRO DE IMÓVEIS', 'REGISTRO DE IMOVEIS'], system: 'REGISTRO DE IMÓVEIS' },
    { keys: ['REGISTRO CIVIL'], system: 'REGISTRO CIVIL' },
    { keys: ['REGISTRO DE TÍTULOS E DOCUMENTOS', 'TITULOS E DOCUMENTOS', 'TÍTULOS E DOCUMENTOS'], system: 'REGISTRO DE TÍTULOS E DOCUMENTOS' },
    { keys: ['TABELIONATO DE PROTESTO', 'PROTESTO DE TÍTULOS', 'TABELIÃES DE PROTESTOS', 'PROTESTOS DE TÍTULOS', 'DE PROTESTOS'], system: 'PROTESTO DE TÍTULOS' }
];

// Função local de parsing monetário específica para as peculiaridades do Excel
const parseMoney = (value) => {
    if (!value) return 0.0;
    if (typeof value === 'number') return value;
    
    let clean = value.toString().trim().replace(/^R\$\s?/, '').trim();
    if (clean === '-' || clean === '') return 0.0;
    
    // Tratamento para 1.234,56 ou 1234,56
    if (clean.includes(',') && clean.includes('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0.0;
};

const getProtestoInfo = (desc, faixaCotacaoCol) => {
    const d = desc.toUpperCase();
    
    const keywords = [
        { key: 'CANCELAMENTO', val: 'AVERBACAO' },
        { key: 'AVERBAÇÃO', val: 'AVERBACAO' },
        { key: 'AVERBACAO', val: 'AVERBACAO' },
        { key: 'INTIMAÇÃO', val: 'INTIMACAO' },
        { key: 'INTIMACAO', val: 'INTIMACAO' },
        { key: 'PROTESTO', val: 'PROTESTO' },
        { key: 'APONTAMENTO', val: 'APONTAMENTO' },
        { key: 'CERTIDÃO', val: 'CERTIDAO' },
        { key: 'CERTIDAO', val: 'CERTIDAO' },
        { key: 'SUSTAÇÃO', val: 'OUTROS' }
    ];

    let bestAto = 'OUTROS';
    let firstIndex = 999999;

    keywords.forEach(kw => {
        const idx = d.indexOf(kw.key);
        if (idx !== -1 && idx < firstIndex) {
            firstIndex = idx;
            bestAto = kw.val;
        }
    });

    const ato = bestAto;
    const isMei = ['MICROEMPRESA', 'EMPRESA DE PEQUENO PORTE', 'MEI'].some(k => d.includes(k));
    const condicao_especial = isMei ? 'MEI_EPP' : 'PADRAO';

    let condicao_pagamento = 'ANTECIPADO';
    if (d.includes('PAGAMENTO POSTERIOR')) {
        condicao_pagamento = 'PAGAMENTO_POSTERIOR';
    } else if (d.includes('PAGAMENTO DIFERIDO')) {
        condicao_pagamento = 'DIFERIDO';
    }

    let inicio = 0.0;
    let fim = null;
    
    const regexVal = /R\$\s?([\d\.,]+)/i;
    const matchAte = desc.match(new RegExp('até\\s+' + regexVal.source, 'i'));
    const matchAcima = desc.match(new RegExp('acima de\\s+' + regexVal.source, 'i'));

    if (matchAte) {
        fim = parseMoney(matchAte[1]);
        if (faixaCotacaoCol > 0) fim = faixaCotacaoCol;
    } else if (matchAcima) {
        inicio = parseMoney(matchAcima[1]);
        if (faixaCotacaoCol > 0) inicio = faixaCotacaoCol;
    } else {
        if (faixaCotacaoCol > 0) fim = faixaCotacaoCol;
    }

    return {
        ato,
        condicao_pagamento,
        condicao_especial,
        faixa_valor_inicio: inicio,
        faixa_valor_fim: fim
    };
};

const detectSystemInRow = (row) => {
    if (!row || !Array.isArray(row)) return null;
    const fullRowText = row.map(c => c ? String(c).toUpperCase().trim() : '').join(' ');
    
    for (const item of SYSTEM_MAP) {
        if (item.keys.some(key => fullRowText.includes(key))) {
            return { system: item.system, foundText: fullRowText };
        }
    }
    return null;
};

// Função Principal Exportada
export const processarTabelaExcel = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            let headerRowIdx = -1;
            let colIndices = {};

            // Encontrar cabeçalho
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;
                const cols = Array.from(row).map(val => (val !== null && val !== undefined) ? String(val).trim() : "");
                const idxId = cols.findIndex(c => c.startsWith('Ids.'));
                
                if (idxId !== -1) {
                    headerRowIdx = i;
                    colIndices.id = idxId;
                    colIndices.desc = cols.findIndex(c => c.includes('Codificação Legal') || c.includes('Nome Atualizado'));
                    colIndices.faixa26 = cols.findIndex(c => c.includes('Faixa de Cotação 2026'));
                    colIndices.comb = cols.findIndex(c => c.includes('Combinação Obrigatória'));
                    colIndices.emol26 = idxId + 4;
                    colIndices.taxa26 = idxId + 5;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                return reject(new Error("Cabeçalho padrão ('Ids. 2022 e 2026') não encontrado no Excel."));
            }

            // Detectar sistema inicial
            let currentSystem = null;
            for (let i = 0; i < headerRowIdx; i++) {
                const sysResult = detectSystemInRow(rows[i]);
                if (sysResult) currentSystem = sysResult.system;
            }
            if (!currentSystem) currentSystem = 'TABELIONATO DE NOTAS';

            const jsonOutput = [];

            // Processar linhas
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i] || [];
                
                const sysChange = detectSystemInRow(row);
                if (sysChange && sysChange.system !== currentSystem) {
                    currentSystem = sysChange.system;
                }

                const rawDesc = row[colIndices.desc];
                const rawId = row[colIndices.id];
                
                let idSelo = null;
                if (rawId && String(rawId).trim() !== '-' && String(rawId).trim() !== '') {
                    idSelo = parseInt(rawId);
                }

                if (!idSelo || isNaN(idSelo)) continue;

                const emolumento = parseMoney(row[colIndices.emol26]);
                const taxa = parseMoney(row[colIndices.taxa26]);
                const faixaVal = parseMoney(row[colIndices.faixa26]);
                
                let idComb = row[colIndices.comb];
                if (idComb) {
                    idComb = String(idComb).trim();
                    if (idComb === '-' || idComb === '0') idComb = null;
                } else {
                    idComb = null;
                }

                const item = {
                    descricao_selo: String(rawDesc || '').trim(),
                    faixa_cotacao: faixaVal || null,
                    id_selo: idSelo,
                    id_selo_combinado: idComb,
                    valor_emolumento: emolumento,
                    valor_taxa_judiciaria: taxa,
                    sistema: currentSystem
                };

                if (currentSystem === 'PROTESTO DE TÍTULOS') {
                    item.faixa_cotacao = null; 
                    const protestoInfo = getProtestoInfo(item.descricao_selo, faixaVal);
                    Object.assign(item, protestoInfo);
                }

                jsonOutput.push(item);
            }

            resolve(jsonOutput);

        } catch (error) {
            reject(error);
        }
    });
};