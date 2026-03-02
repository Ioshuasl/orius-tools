import * as minutaService from '../services/minutaService.js';

export const importar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        
        const resultado = await minutaService.processarImportacao(req.file);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const qualificar = async (req, res) => {
    const { htmlDoc, dados } = req.body;
    // Lógica futura de substituição inteligente
    res.json({ success: true, message: "Dados prontos para qualificação." });
};