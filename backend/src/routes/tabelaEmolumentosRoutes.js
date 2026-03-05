import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { 
    importTabelaXlsx, 
    getAllTabelas, 
    getTabelaById 
} from '../controllers/tabelaEmolumentosController.js';

const router = express.Router();

/**
 * @route   POST /api/tabelas/import
 * @desc    Importa uma nova tabela de emolumentos via Excel.
 * O middleware 'upload' já trata a persistência e segurança do arquivo.
 */
router.post('/import', upload.single('file'), importTabelaXlsx);

/**
 * @route   GET /api/tabelas
 * @desc    Retorna todos os cabeçalhos das tabelas cadastradas.
 */
router.get('/', getAllTabelas);

/**
 * @route   GET /api/tabelas/:id
 * @desc    Retorna os dados completos de uma tabela e seus respectivos registros.
 */
router.get('/:id', getTabelaById);

export default router;