import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Converte RTF para HTML via LibreOffice Headless.
 */
export const convertRtfToHtml = (inputPath) => {
    const tempDir = path.dirname(inputPath);
    const fileName = path.basename(inputPath, path.extname(inputPath));
    const sofficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
    
    const command = `${sofficePath} --headless --convert-to html --outdir "${tempDir}" "${inputPath}"`;
    execSync(command);
    return path.join(tempDir, `${fileName}.html`);
};

/**
 * Limpa códigos de controle RTF para exibição legível.
 */
export const limparTagRTF = (tag) => {
    return tag
        .replace(/\\\'AB/g, '«')
        .replace(/\\\'BB/g, '»')
        .replace(/\\u8226\s?\??/g, '•')
        .replace(/\\\'E7/g, 'ç')
        .replace(/\\\'E3/g, 'ã')
        .replace(/\\\'BA/g, 'º')
        .replace(/\\\'F5/g, 'õ')
        .replace(/\\\'ED/g, 'í')
        .replace(/\\\'E1/g, 'á')
        .replace(/[\r\n\t]+/g, ' '); 
};

/**
 * Extrai variáveis do conteúdo bruto do RTF.
 */
export const extrairVariaveisDoRtfContent = (conteudoRtf) => {
    const regexManuais = /(?:[a-zA-Z0-9\s]|\\u\d+\s?\??|\\'[\dA-Fa-f]{2})+\\'ABm\\'BB/g;
    const regexAuto = /(?:[a-zA-Z0-9\s]|\\u\d+\s?\??|\\'[\dA-Fa-f]{2})+\\'ABa\\'BB/g;

    const manuaisRaw = conteudoRtf.match(regexManuais) || [];
    const autoRaw = conteudoRtf.match(regexAuto) || [];

    return {
        manuais: [...new Set(manuaisRaw.map(limparTagRTF))],
        automaticas: [...new Set(autoRaw.map(limparTagRTF))]
    };
};

/**
 * Remove âncoras e artefatos visuais do HTML convertido.
 */
export const limparArtefatosHtml = (html) => {
    return html
        // 1. Remove âncoras vazias <a name="..."></a> que aparecem como marcadores 
        .replace(/<a name=".*?"><\/a>/g, '')
        // 2. Remove o caractere Wingdings "م" que aparece em "manifestação" [cite: 2]
        .replace(/<font face="Wingdings">.*?<\/font>/g, 'ã')
        // 3. Normaliza espaços e quebras técnicas
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/>\s+</g, '><');
};