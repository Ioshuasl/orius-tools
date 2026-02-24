import fs from 'fs';
import path from 'path';
import { validarXmlCep, aplicarCorrecoesXml as aplicarCep } from '../services/cepService.js';
import { validarXmlCesdi, aplicarCorrecoesXml as aplicarCesdi } from '../services/cesdiService.js';
import { validarXmlRcto, aplicarCorrecoesRcto } from '../services/rctoService.js';

/**
 * Funções Auxiliares de Resposta
 */
const responderValidacao = (res, result, filePath) => {
    // Limpeza do arquivo original após leitura
    try { fs.unlinkSync(filePath); } catch (e) { }
    
    return res.json({
        success: result.sucesso,
        total_atos_agrupados: result.totalAtos,
        total_erros: result.erros.length,
        erros: result.erros
    });
};

const responderCorrecao = (res, xmlCorrigido, novaValidacao) => {
    // Configura os headers para o frontend CepCensec.tsx identificar o status da re-validação
    res.set('Content-Type', 'text/xml');
    res.set('Access-Control-Expose-Headers', 'X-Validation-Success, X-Validation-Errors');
    res.set('X-Validation-Success', String(novaValidacao.sucesso));
    res.set('X-Validation-Errors', String(novaValidacao.erros.length));

    return res.send(xmlCorrigido);
};

// --- CONTROLLER CEP ---

export const validarCepXml = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo XML enviado.' });
    try {
        const result = await validarXmlCep(req.file.path);
        responderValidacao(res, result, req.file.path);
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao validar CEP.', details: error.message });
    }
};

export const corrigirCepXml = async (req, res) => {
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    if (!file || !req.body.correcoes) return res.status(400).json({ error: 'Dados insuficientes.' });

    const tempPath = path.join(path.dirname(file.path), `fixed_cep_${Date.now()}.xml`);
    try {
        const correcoes = JSON.parse(req.body.correcoes);
        const xml = await aplicarCep(file.path, correcoes);
        
        fs.writeFileSync(tempPath, xml);
        const novaValidacao = await validarXmlCep(tempPath);

        // Limpeza
        try { fs.unlinkSync(file.path); } catch (e) { }
        try { fs.unlinkSync(tempPath); } catch (e) { }

        responderCorrecao(res, xml, novaValidacao);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao corrigir CEP.', details: error.message });
    }
};

// --- CONTROLLER CESDI ---

export const validarCesdiXml = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo XML enviado.' });
    try {
        const result = await validarXmlCesdi(req.file.path);
        responderValidacao(res, result, req.file.path);
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao validar CESDI.', details: error.message });
    }
};

export const corrigirCesdiXml = async (req, res) => {
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    if (!file || !req.body.correcoes) return res.status(400).json({ error: 'Dados insuficientes.' });

    const tempPath = path.join(path.dirname(file.path), `fixed_cesdi_${Date.now()}.xml`);
    try {
        const correcoes = JSON.parse(req.body.correcoes);
        const xml = await aplicarCesdi(file.path, correcoes);
        
        fs.writeFileSync(tempPath, xml);
        const novaValidacao = await validarXmlCesdi(tempPath);

        // Limpeza dos arquivos temporários
        try { fs.unlinkSync(file.path); } catch (e) { }
        try { fs.unlinkSync(tempPath); } catch (e) { }

        responderCorrecao(res, xml, novaValidacao);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao corrigir CESDI.', details: error.message });
    }
};

// --- CONTROLLER RCTO ---

export const validarRctoXml = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro XML enviado.' });
    try {
        const result = await validarXmlRcto(req.file.path);
        responderValidacao(res, result, req.file.path);
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao validar RCTO.', details: error.message });
    }
};

export const corrigirRctoXml = async (req, res) => {
    const file = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    if (!file || !req.body.correcoes) return res.status(400).json({ error: 'Dados insuficientes.' });

    const tempPath = path.join(path.dirname(file.path), `fixed_rcto_${Date.now()}.xml`);
    try {
        const correcoes = JSON.parse(req.body.correcoes);
        const xml = await aplicarCorrecoesRcto(file.path, correcoes);
        
        fs.writeFileSync(tempPath, xml);
        const novaValidacao = await validarXmlRcto(tempPath);

        // Limpeza dos ficheiros temporários
        try { fs.unlinkSync(file.path); } catch (e) { }
        try { fs.unlinkSync(tempPath); } catch (e) { }

        responderCorrecao(res, xml, novaValidacao);
    } catch (error) {
        if (file) try { fs.unlinkSync(file.path); } catch (e) { }
        res.status(500).json({ error: 'Erro ao corrigir RCTO.', details: error.message });
    }
};