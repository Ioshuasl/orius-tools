import fs from 'fs';
import path from 'path';
import { validarJsonDoi, corrigirJsonDoi } from '../services/doiService.js';

/**
 * Funções Auxiliares de Resposta
 */
const responderValidacao = (res, result, filePath) => {
    // Remove o arquivo enviado após o processamento para economizar espaço
    try { fs.unlinkSync(filePath); } catch (e) { }
    
    return res.json({
        success: result.sucesso,
        total_atos: result.totalAtos,
        total_erros: result.erros.length,
        erros: result.erros
    });
};

const responderCorrecao = (res, jsonCorrigido, novaValidacao) => {
    // Configura os headers para o frontend identificar o status da re-validação
    res.set('Content-Type', 'application/json');
    res.set('Access-Control-Expose-Headers', 'X-Validation-Success, X-Validation-Errors');
    res.set('X-Validation-Success', String(novaValidacao.sucesso));
    res.set('X-Validation-Errors', String(novaValidacao.erros.length));

    return res.send(jsonCorrigido);
};

// --- CONTROLLER DOI ---

/**
 * Endpoint para validar o arquivo JSON da DOI enviado pelo sistema legado
 */
export const validarDoiJson = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo JSON enviado.' });
    
    try {
        const result = await validarJsonDoi(req.file.path);
        responderValidacao(res, result, req.file.path);
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao validar DOI.', details: error.message });
    }
};

/**
 * Endpoint para aplicar as correções e retornar o arquivo higienizado
 */
export const corrigirDoiJson = async (req, res) => {
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    if (!file || !req.body.correcoes) return res.status(400).json({ error: 'Dados insuficientes.' });

    const tempPath = path.join(path.dirname(file.path), `fixed_doi_${Date.now()}.json`);
    
    try {
        const correcoes = JSON.parse(req.body.correcoes);
        const jsonCorrigido = await corrigirJsonDoi(file.path, correcoes);
        
        // Salva temporariamente para realizar a re-validação
        fs.writeFileSync(tempPath, jsonCorrigido);
        const novaValidacao = await validarJsonDoi(tempPath);

        // Limpeza dos arquivos temporários
        try { fs.unlinkSync(file.path); } catch (e) { }
        try { fs.unlinkSync(tempPath); } catch (e) { }

        responderCorrecao(res, jsonCorrigido, novaValidacao);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao corrigir DOI.', details: error.message });
    }
};