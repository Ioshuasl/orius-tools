import fs from 'fs';
import { validarXmlCep, aplicarCorrecoesXml } from '../services/cepService.js';

export const validarCensecXml = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo XML enviado.' });
    }

    try {
        const result = await validarXmlCep(req.file.path);
        
        // Limpeza imediata do arquivo
        try { fs.unlinkSync(req.file.path); } catch(e) {}

        res.json({
            success: result.sucesso,
            total_atos_agrupados: result.totalAtos,
            total_erros: result.erros.length,
            erros: result.erros
        });
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch(e) {}
        res.status(500).json({ error: 'Erro ao validar XML CENSEC.', details: error.message });
    }
};

export const corrigirCensecXml = async (req, res) => {
    // Busca o arquivo no array gerado pelo upload.any()
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;

    if (!file || !req.body.correcoes) {
        return res.status(400).json({ error: 'Faltam o arquivo ou as instruções de correção.' });
    }

    try {
        // As correções vêm como string do FormData
        const listaCorrecoes = JSON.parse(req.body.correcoes);
        
        const xmlCorrigido = await aplicarCorrecoesXml(file.path, listaCorrecoes);
        
        try { fs.unlinkSync(file.path); } catch(e) {}

        // Define o tipo de retorno como XML
        res.set('Content-Type', 'text/xml');
        res.send(xmlCorrigido);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch(e) {}
        res.status(500).json({ error: 'Erro ao processar correções.', details: error.message });
    }
};