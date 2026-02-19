import fs from 'fs';
import { validarXmlCep } from '../services/cepService.js';
import { aplicarCorrecoesXml } from '../services/cepService.js';
import { DOMParser, XMLSerializer } from 'xmldom';

export const validarCensecXml = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo XML enviado.' });
    }

    try {
        console.log(`📥 [CENSEC] Validando XML: ${req.file.originalname}`);
        
        const result = await validarXmlCep(req.file.path);
        
        // Limpar arquivo temporário
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: result.sucesso,
            total_atos_agrupados: result.totalAtos,
            total_erros: result.erros.length,
            erros: result.erros
        });

    } catch (error) {
        console.error('❌ Erro na validação CENSEC:', error);
        try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.status(500).json({ error: 'Erro interno ao validar XML CENSEC.', details: error.message });
    }
};

export const corrigirCensecXml = async (req, res) => {
    // Com upload.any(), os arquivos ficam em req.files
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;

    if (!file || !req.body.correcoes) {
        return res.status(400).json({ error: 'Arquivo e correções são obrigatórios.' });
    }

    try {
        const listaCorrecoes = JSON.parse(req.body.correcoes);
        const xmlCorrigido = await aplicarCorrecoesXml(file.path, listaCorrecoes);
        
        // Limpeza
        try { fs.unlinkSync(file.path); } catch(e) {}

        res.set('Content-Type', 'text/xml');
        res.send(xmlCorrigido);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch(e) {}
        res.status(500).json({ error: error.message });
    }
};