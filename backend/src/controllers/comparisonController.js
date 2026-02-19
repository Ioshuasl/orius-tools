import fs from 'fs';
import { processarGuiaSistema } from '../services/textService.js';
import { processarGuiaCsv } from '../services/csvService.js';
import { compararResultados } from '../services/comparsionService.js';
import { loadReferenceMap } from '../utils/referenceLoader.js';

// Carrega o mapa de referência
const referenceMap = loadReferenceMap();

export const realizarComparacaoCompleta = async (req, res) => {
    // 1. Validação dos arquivos
    if (!req.files || !req.files['pdf'] || !req.files['csv']) {
        return res.status(400).json({ 
            error: 'É necessário enviar dois arquivos: um campo "pdf" e um campo "csv".' 
        });
    }

    const pdfFile = req.files['pdf'][0];
    const csvFile = req.files['csv'][0];

    try {
        console.log(`⚖️  Iniciando comparação: ${pdfFile.originalname} vs ${csvFile.originalname}`);

        // 2. Processamento Paralelo (Leitura dos arquivos)
        const [resultadoPdf, resultadoCsv] = await Promise.all([
            processarGuiaSistema(pdfFile.path, referenceMap),
            processarGuiaCsv(csvFile.path)
        ]);

        // 3. Comparação Lógica (Gera o Log de Auditoria)
        const relatorio = compararResultados(resultadoPdf, resultadoCsv);

        // 4. Limpeza dos arquivos temporários
        try {
            fs.unlinkSync(pdfFile.path);
            fs.unlinkSync(csvFile.path);
        } catch (e) {
            console.error('Erro ao limpar arquivos temporários', e);
        }

        // 5. Resposta JSON (Adaptada para a nova estrutura do Service)
        res.json({
            success: true,
            arquivos_processados: {
                pdf: pdfFile.originalname,
                csv: csvFile.originalname
            },
            // Agora usamos diretamente as estatísticas calculadas pelo serviço
            estatisticas_gerais: relatorio.estatisticas,
            
            // O resumo comparativo do cabeçalho (Totais)
            auditoria_cabecalho: relatorio.resumo_comparativo,
            
            // A lista detalhada linha a linha
            auditoria_registros: relatorio.analise_registros,
            
            // Timestamp da análise
            data_analise: relatorio.timestamp
        });

    } catch (error) {
        console.error('❌ Erro na comparação:', error);
        
        // Tenta limpar arquivos em caso de erro fatal
        try {
            if (fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
            if (fs.existsSync(csvFile.path)) fs.unlinkSync(csvFile.path);
        } catch(e) {}

        res.status(500).json({ 
            error: 'Erro ao processar a comparação.', 
            details: error.message 
        });
    }
};