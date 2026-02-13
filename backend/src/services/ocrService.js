import { exec } from 'child_process';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import { parseCurrency } from '../utils/helpers.js';

const PDFTOPPM_PATH = process.env.PDFTOPPM_PATH || 
    (process.platform === 'win32' ? 'C:\\poppler\\Library\\bin\\pdftoppm.exe' : 'pdftoppm');

const convertPdfToImages = (inputPdfPath) => {
    return new Promise((resolve, reject) => {
        // Prefixo com timestamp para evitar colisão
        const outputPrefix = `temp_${Date.now()}`;
        // Nota: O pdftoppm vai gerar os ficheiros na pasta onde o comando é executado
        const command = `"${PDFTOPPM_PATH}" -png -r 300 "${inputPdfPath}" "${outputPrefix}"`;

        exec(command, (error) => {
            if (error) { reject(error); return; }
            
            // Procura os ficheiros gerados na pasta atual (raiz ou onde o node correu)
            const files = fs.readdirSync(process.cwd())
                .filter(f => f.startsWith(outputPrefix) && f.endsWith('.png'));
            
            files.sort((a, b) => {
                const numA = parseInt(a.match(/(\d+)\.png$/)[1]);
                const numB = parseInt(b.match(/(\d+)\.png$/)[1]);
                return numA - numB;
            });
            resolve(files);
        });
    });
};

const runOcrOnImages = async (imageFiles) => {
    const worker = await Tesseract.createWorker('por');
    let fullText = '';
    
    for (const file of imageFiles) {
        const { data: { text } } = await worker.recognize(file);
        fullText += text + '\n';
        // Remove imagem temporária
        try { fs.unlinkSync(file); } catch(e) {} 
    }
    
    await worker.terminate();
    return fullText;
};

const parseTextToData = (text, referenceMap) => {
    const lines = text.split('\n');
    const extractedData = [];
    let descriptionBuffer = '';
    
    const rowRegex = /(\d+)\s+(?:R\$|RS|Rs|R\s\$)?\s?([\d.,]+)\s+(?:R\$|RS|Rs|R\s\$)?\s?([\d.,]+)\s+(?:R\$|RS|Rs|R\s\$)?\s?([\d.,]+)\s+(?:R\$|RS|Rs|R\s\$)?\s?([\d.,]+)\s*$/i;
    const ignorePatterns = [/Sistema Extrajudicial/i, /Arrecadação:/i, /Tabelionato/i, /Serventias/i, /Voltar/i, /^\s*Page\s+\d+/i, /^[|L\s)(\]\[=]+$/, /Corregedoria Geral/i];

    lines.forEach((line) => {
        let trimmedLine = line.trim();
        if (!trimmedLine) return;
        if (trimmedLine.match(/Tipo Ato|Quantidade|Judici..?ria|Emolumento/i)) {
            descriptionBuffer = ''; return;
        }
        if (ignorePatterns.some(pattern => pattern.test(trimmedLine))) return;

        const match = trimmedLine.match(rowRegex);

        if (match) {
            const descriptionPart = trimmedLine.substring(0, match.index).trim();
            const fullDescription = (descriptionBuffer + ' ' + descriptionPart).trim();
            
            const codeMatch = fullDescription.match(/(\d{4})\s*[-–—]/);
            const fallbackMatch = fullDescription.match(/^(\d{4})\b/);
            
            let codigoExtract = null;
            if (codeMatch) codigoExtract = parseInt(codeMatch[1], 10);
            else if (fallbackMatch) codigoExtract = parseInt(fallbackMatch[1], 10);

            let finalTipoAto = fullDescription;
            if (codigoExtract && referenceMap.has(codigoExtract)) {
                finalTipoAto = `${codigoExtract} - ${referenceMap.get(codigoExtract)}`;
            } else {
                finalTipoAto = fullDescription.replace(/^[\d-]+\s*[-–—]\s*/, '').replace(/^-\s*/, '');
                if (codigoExtract) finalTipoAto = `${codigoExtract} - ${finalTipoAto}`;
            }

            extractedData.push({
                codigo: codigoExtract,
                tipo_ato: finalTipoAto,
                quantidade: parseInt(match[1], 10),
                valor_taxa_judiciaria: parseCurrency(match[2]),
                valor_emolumento: parseCurrency(match[3]),
                valor_total_taxa_judiciaria: parseCurrency(match[4]),
                valor_total_emolumento: parseCurrency(match[5])
            });
            descriptionBuffer = '';
        } else {
            if (trimmedLine.length > 3) descriptionBuffer += trimmedLine + ' ';
        }
    });
    return extractedData;
};

export const processarReceitaSee = async (filePath, referenceMap) => {
    const imageFiles = await convertPdfToImages(filePath);
    const rawText = await runOcrOnImages(imageFiles);
    return parseTextToData(rawText, referenceMap);
};