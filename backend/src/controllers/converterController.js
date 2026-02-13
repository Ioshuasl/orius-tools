import fs from 'fs';
import { processarReceitaSee } from '../services/ocrService.js';
import { processarGuiaSistema } from '../services/textService.js';
import { processarTabelaExcel } from '../services/excelService.js';
import { processarGuiaCsv } from '../services/csvService.js';
import { loadReferenceMap } from '../utils/referenceLoader.js';

// Carregamos o mapa uma única vez ao iniciar a aplicação (cache em memória)
const referenceMap = loadReferenceMap();

export const convertReceitaSee = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum ficheiro PDF enviado.' });
    }

    try {
        console.log(`📥 A processar (OCR): ${req.file.originalname}`);
        
        const data = await processarReceitaSee(req.file.path, referenceMap);
        
        // Limpar ficheiro temporário
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: true,
            total_registros: data.length,
            data: data
        });

    } catch (error) {
        console.error('Erro no processamento SEE:', error);
        res.status(500).json({ error: 'Erro ao processar PDF.', details: error.message });
    }
};

export const convertGuiaSistema = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum ficheiro PDF enviado.' });
    }

    try {
        console.log(`📥 A processar (Texto): ${req.file.originalname}`);
        
        const data = await processarGuiaSistema(req.file.path, referenceMap);
        
        // Limpar ficheiro temporário
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: true,
            resumo: data.resumo,
            total_registros: data.registros.length,
            registros: data.registros
        });

    } catch (error) {
        console.error('Erro no processamento Guia Sistema:', error);
        res.status(500).json({ error: 'Erro ao processar PDF.', details: error.message });
    }
};

export const convertTabelaEmolumentos = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo Excel (.xlsx) enviado.' });
    }

    try {
        console.log(`📥 [Orius] Processando Tabela Excel: ${req.file.originalname}`);
        
        const data = await processarTabelaExcel(req.file.path);
        
        // Limpar ficheiro temporário
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: true,
            origem: "tabela_emolumentos",
            total_registros: data.length,
            data: data
        });

    } catch (error) {
        console.error('❌ Erro no processamento Excel:', error);
        // Tentar limpar o arquivo mesmo em caso de erro
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        
        res.status(500).json({ error: 'Erro ao processar Tabela Excel.', details: error.message });
    }
};

// Nova função para CSV de Guia
export const convertGuiaCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
    }

    try {
        console.log(`📥 [Orius] Processando Guia CSV: ${req.file.originalname}`);
        
        const data = await processarGuiaCsv(req.file.path);
        
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: true,
            origem: "guia_csv_see",
            resumo: data.resumo,
            total_registros: data.registros.length,
            registros: data.registros
        });

    } catch (error) {
        console.error('❌ Erro no processamento CSV:', error);
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.status(500).json({ error: 'Erro ao processar CSV.', details: error.message });
    }
};