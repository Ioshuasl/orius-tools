import Cbo from '../models/Cbo.js';
import { Op } from 'sequelize';
import { convertCboPdfToJson } from '../services/cboConverterService.js';
import fs from 'node:fs';

/**
 * Importar PDF via upload (req.file) e salvar no banco usando bulkCreate
 */
export const importPdf = async (req, res) => {
    // Caminho do arquivo temporário gerado pelo multer
    const filePath = req.file?.path;

    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nenhum arquivo PDF foi enviado.' 
            });
        }

        console.log(`⏳ Iniciando extração do arquivo: ${req.file.originalname}`);
        const data = await convertCboPdfToJson(filePath);
        
        console.log(`⏳ Inserindo ${data.length} registros no banco...`);
        
        const result = await Cbo.bulkCreate(data, { 
            ignoreDuplicates: true 
        });

        // Remove o arquivo físico após processar para não ocupar espaço em disco
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(201).json({
            success: true,
            message: 'Importação concluída com sucesso.',
            totalProcessado: data.length,
            totalInserido: result.length
        });
    } catch (error) {
        // Tenta remover o arquivo mesmo em caso de erro
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.error('Erro na importação de PDF:', error);
        res.status(500).json({ 
            success: false,
            error: 'Falha ao processar e importar PDF.', 
            details: error.message 
        });
    }
};

/**
 * Listar CBOs com paginação
 */
export const listCbos = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query; // Captura o 'search'
        const offset = (page - 1) * limit;

        // Cria o objeto de filtro condicionalmente
        const where = search ? {
            [Op.or]: [
                { codigo: { [Op.iLike]: `%${search}%` } }, // iLike para ignorar maiúsculas/minúsculas
                { titulo: { [Op.iLike]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await Cbo.findAndCountAll({
            where, // Aplica o filtro aqui
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['titulo', 'ASC']]
        });

        res.json({
            success: true,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: rows
        });
    } catch (error) {
        console.error('Erro ao listar CBOs:', error);
        res.status(500).json({ error: 'Erro ao listar registros.', details: error.message });
    }
};

/**
 * Buscar registro por ID
 */
export const getCboById = async (req, res) => {
    try {
        const { id } = req.params;
        const cbo = await Cbo.findByPk(id);

        if (!cbo) return res.status(404).json({ error: 'Registro não encontrado.' });

        res.json({
            success: true,
            data: cbo
        });
    } catch (error) {
        console.error('Erro ao buscar CBO:', error);
        res.status(500).json({ error: 'Erro ao buscar registro.', details: error.message });
    }
};

/**
 * Criar um novo registro manualmente
 */
export const createCbo = async (req, res) => {
    try {
        const newCbo = await Cbo.create(req.body);
        
        res.status(201).json({
            success: true,
            data: newCbo
        });
    } catch (error) {
        console.error('Erro ao criar CBO:', error);
        res.status(500).json({ error: 'Erro ao criar registro.', details: error.message });
    }
};

/**
 * Atualizar um registro existente
 */
export const updateCbo = async (req, res) => {
    try {
        const { id } = req.params;
        const cbo = await Cbo.findByPk(id);

        if (!cbo) return res.status(404).json({ error: 'Registro não encontrado.' });

        await cbo.update(req.body);
        
        res.json({
            success: true,
            data: cbo
        });
    } catch (error) {
        console.error('Erro ao atualizar CBO:', error);
        res.status(500).json({ error: 'Erro ao atualizar registro.', details: error.message });
    }
};

/**
 * Deletar um registro
 */
export const deleteCbo = async (req, res) => {
    try {
        const { id } = req.params;
        const cbo = await Cbo.findByPk(id);

        if (!cbo) return res.status(404).json({ error: 'Registro não encontrado.' });

        await cbo.destroy();
        
        res.json({
            success: true,
            message: 'Registro deletado com sucesso.'
        });
    } catch (error) {
        console.error('Erro ao deletar CBO:', error);
        res.status(500).json({ error: 'Erro ao deletar registro.', details: error.message });
    }
};