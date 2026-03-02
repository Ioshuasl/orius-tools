import fs from 'node:fs';
import * as rtfHelper from '../utils/rtfHelper.js';

export const processarImportacao = async (file) => {
    // 1. Extração fiel das variáveis do RTF bruto [cite: 4]
    const conteudoRtf = fs.readFileSync(file.path, 'utf-8');
    const { manuais, automaticas } = rtfHelper.extrairVariaveisDoRtfContent(conteudoRtf);
    const todasVariaveis = [...manuais, ...automaticas];

    // 2. Conversão para HTML
    const htmlPath = rtfHelper.convertRtfToHtml(file.path);
    let rawHtml = fs.readFileSync(htmlPath, 'utf-8');

    // 3. Extração e limpeza profunda do Body 
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let htmlFinal = bodyMatch ? bodyMatch[1] : rawHtml;
    
    // Remove marcadores, âncoras e Wingdings 
    htmlFinal = rtfHelper.limparArtefatosHtml(htmlFinal);

    // 4. Injeção das variáveis no HTML limpo 
    todasVariaveis.forEach(variavel => {
        const type = variavel.endsWith('«m»') ? 'manual' : 'auto';
        const span = `<span class="variable-tag tag-${type}" data-variable="${variavel}">${variavel}</span>`;
        
        // Substituição global da string exata encontrada no RTF
        htmlFinal = htmlFinal.split(variavel).join(span);
    });

    // Limpeza de arquivos temporários
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);

    return {
        html: htmlFinal,
        variaveis: todasVariaveis
    };
};