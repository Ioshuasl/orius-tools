/**
 * Calcula os fundos estaduais e de assistência baseados no valor dos emolumentos.
 * @param {number} valorEmolumentos - O valor base (Totalizador Geral).
 * @returns {object} - Objeto contendo cada fundo calculado e o total.
 */
export function calcularFundos(valorEmolumentos) {
    // Definição das alíquotas conforme a imagem fornecida
    const aliquotas = {
        fundesp: 0.10,        // 10%
        funcomp: 0.06,        // 6% (Atualizado após 24/03/2025)
        funemp: 0.03,         // 3%
        advogados: 0.02,      // 2%
        funproge: 0.02,       // 2%
        fundepeg: 0.0125      // 1.25%
    };

    // Cálculo individual de cada fundo com arredondamento de 2 casas decimais
    const resultados = {
        fundesp: Number((valorEmolumentos * aliquotas.fundesp).toFixed(2)),
        funcomp: Number((valorEmolumentos * aliquotas.funcomp).toFixed(2)),
        funemp: Number((valorEmolumentos * aliquotas.funemp).toFixed(2)),
        advogados: Number((valorEmolumentos * aliquotas.advogados).toFixed(2)),
        funproge: Number((valorEmolumentos * aliquotas.funproge).toFixed(2)),
        fundepeg: Number((valorEmolumentos * aliquotas.fundepeg).toFixed(2))
    };

    // Soma total dos fundos calculados
    const totalFundos = Object.values(resultados).reduce((acc, curr) => acc + curr, 0);

    return {
        detalhado: resultados,
        total: Number(totalFundos.toFixed(2))
    };
}

// Exemplo de uso com o valor que você enviou (5.188,50)
const resultado = calcularFundos(5188.50);
console.log(resultado);