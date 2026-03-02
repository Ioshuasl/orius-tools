import { Router } from 'express';
import upload from '../middlewares/uploadMiddleware.js'; // Ajuste o caminho conforme sua pasta
import {
    importPdf,
    listCbos,
    getCboById,
    createCbo,
    updateCbo,
    deleteCbo
} from '../controllers/cboController.js';

const router = Router();

/**
 * @route   POST /api/cbo/import
 * @desc    Faz o upload do PDF da CBO e popula o banco de dados
 * @access  Private (Recomendado adicionar middleware de auth aqui)
 */
router.post('/import', upload.single('file'), importPdf);

/**
 * @route   GET /api/cbo
 * @desc    Lista todas as profissões com suporte a paginação
 */
router.get('/', listCbos);

/**
 * @route   GET /api/cbo/:id
 * @desc    Busca uma profissão específica pelo ID
 */
router.get('/:id', getCboById);

/**
 * @route   POST /api/cbo
 * @desc    Cria manualmente um novo registro de CBO
 */
router.post('/', createCbo);

/**
 * @route   PUT /api/cbo/:id
 * @desc    Atualiza os dados de uma profissão
 */
router.put('/:id', updateCbo);

/**
 * @route   DELETE /api/cbo/:id
 * @desc    Remove um registro de CBO do sistema
 */
router.delete('/:id', deleteCbo);

export default router;