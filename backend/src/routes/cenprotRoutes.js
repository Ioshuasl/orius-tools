import express from 'express';
import * as cenprotController from '../controllers/cenprotController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

/**
 * Rota para validação de XMLs CENPROT em lote (máximo 4 arquivos)
 * O campo no FormData deve se chamar 'files'
 */
router.post('/validar-lote', upload.array('files', 4), cenprotController.validarLote);

export default router;