import fs from 'fs';
import { processarDoi } from '../services/doiService.js';

export const validarCorrigirDoi = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo JSON enviado.' });
    }

    try {
        console.log(`📥 [Orius] Processando DOI: ${req.file.originalname}`);
        
        const resultado = await processarDoi(req.file.path);
        
        // Limpar arquivo temporário
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: true,
            origem: "doi_validator",
            is_valid: resultado.is_valid,
            total_errors: resultado.errors.length,
            errors: resultado.errors,
            data: resultado.data
        });

    } catch (error) {
        console.error('❌ Erro no processamento DOI:', error);
        // Tentar limpar arquivo
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao processar arquivo DOI.', 
            details: error.message 
        });
    }
};