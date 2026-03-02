import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Em ES Modules, precisamos definir o __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do caminho do executável do Poppler
const PDF_TO_TEXT_PATH = 'C:\\poppler\\Library\\bin\\pdftotext.exe';

/**
 * Converte o PDF de CBO para um formato JSON.
 * @param {string} inputPdfPath - Caminho completo para o arquivo PDF.
 * @returns {Promise<Array>} - Array de objetos contendo código, título e tipo.
 */
export function convertCboPdfToJson(inputPdfPath) {
    return new Promise((resolve, reject) => {
        // Comando utilizando a flag -layout para preservar a estrutura de colunas
        const command = `"${PDF_TO_TEXT_PATH}" -layout "${inputPdfPath}" -`;

        // Buffer de 50MB para suportar o volume de dados do CBO
        exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Erro ao executar pdftotext: ${error.message}`));
            }

            const lines = stdout.split(/\r?\n/);
            const results = [];

            /**
             * Regex: 
             * 1. Código (ex: 6125-10 ou 2631)
             * 2. Título (o texto central)
             * 3. Tipo (Ocupação, Sinônimo ou Família no final da linha)
             */
            const rowRegex = /^(\d{4}(?:-\d{2})?)\s+(.*?)\s+(Ocupação|Sinônimo|Família)$/i;

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (!trimmedLine || trimmedLine.includes("Relatório de Titulo") || trimmedLine.includes("CBO 2002")) {
                    continue;
                }

                const match = trimmedLine.match(rowRegex);
                if (match) {
                    results.push({
                        codigo: match[1].trim(),
                        titulo: match[2].trim(),
                        tipo: match[3].trim()
                    });
                }
            }

            resolve(results);
        });
    });
}

/**
 * Lógica para execução direta do script (Equivalente ao require.main === module)
 */
const isMainModule = process.argv[1] === __filename || process.argv[1]?.endsWith('cboConverterService.js');

if (isMainModule) {
    const pdfPath = path.join(__dirname, 'cbo2002_lista.pdf');
    
    console.log("🚀 Iniciando conversão (ESM)...");
    
    try {
        const cboJson = await convertCboPdfToJson(pdfPath); // Top-level await permitido em ESM
        
        const outputPath = path.join(__dirname, 'cbo_convertido.json');
        fs.writeFileSync(outputPath, JSON.stringify(cboJson, null, 2), 'utf-8');
        
        console.log(`✅ Sucesso! ${cboJson.length} registros processados.`);
        console.log(`📂 Arquivo salvo em: ${outputPath}`);
    } catch (err) {
        console.error("❌ Falha na conversão:", err);
    }
}