export const parseCurrency = (valueStr) => {
    if (!valueStr) return 0;
    // Remove tudo que não é número, vírgula, ponto ou sinal de menos
    let cleanStr = valueStr.replace(/[^\d.,-]/g, '');
    cleanStr = cleanStr.replace(',', '.');
    
    // Trata múltiplos pontos (milhares)
    const parts = cleanStr.split('.');
    if (parts.length > 2) {
        cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    const number = parseFloat(cleanStr);
    return isNaN(number) ? 0 : number;
};