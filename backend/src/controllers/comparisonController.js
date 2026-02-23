import fs from 'fs';
import { processarGuiaSistema } from '../services/textService.js';
import { processarGuiaCsv } from '../services/csvService.js';
import { compararResultados } from '../services/comparsionService.js';

/**
 * Controller responsável por coordenar a comparação entre a Guia do Sistema (PDF)
 * e o Arquivo de Conferência (CSV/XLSX).
 */
export const realizarComparacaoCompleta = async (req, res) => {
    // Recupera os caminhos dos arquivos enviados via upload (ex: multer)
    if (!req.files || !req.files['pdf'] || !req.files['csv']) {
        return res.status(400).json({ 
            error: 'É necessário enviar dois arquivos: um campo "pdf" e um campo "csv".' 
        });
    }

    const pdfFile = req.files['pdf'][0];
    const csvFile = req.files['csv'][0];

    try {
        // 1. Processamento paralelo dos dois tipos de arquivos
        // O processarGuiaSistema agora retorna o detalhamento_fundos por registro
        // O processarGuiaCsv agora utiliza a função calcularFundos internamente
        const [resultadoPdf, resultadoCsv] = await Promise.all([
            processarGuiaSistema(pdfFile.path),
            processarGuiaCsv(csvFile.path)
        ]);

        // 2. Execução da lógica de auditoria/comparação refatorada
        // O service agora compara o valor_total_fundos unificado
        const relatorio = compararResultados(resultadoPdf, resultadoCsv);

        // 3. Resposta com o log de auditoria completo
        return res.json({
            success: true,
            data: relatorio
        });

    } catch (error) {
        console.error('Erro durante a comparação de arquivos:', error);
        return res.status(500).json({ 
            error: 'Falha ao processar e comparar os arquivos.',
            details: error.message 
        });
    } finally {
        // 4. Limpeza: Remove os arquivos temporários do servidor para economizar espaço
        if (pdfFile && fs.existsSync(pdfFile.path)) {
            fs.unlinkSync(pdfFile.path);
        }
        if (csvFile && fs.existsSync(csvFile.path)) {
            fs.unlinkSync(csvFile.path);
        }
    }
};