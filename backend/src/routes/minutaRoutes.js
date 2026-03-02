import { Router } from 'express';
import upload from '../middlewares/uploadMiddleware.js'; // Ajuste o caminho conforme sua estrutura
import * as minutaController from '../controllers/minutaController.js';

const router = Router();

/**
 * Rota para importar a minuta RTF
 * Usa o middleware customizado para validar e salvar o arquivo em /uploads
 */
router.post('/import', upload.single('minuta'), minutaController.importar);

/**
 * Rota para processar a qualificação dos dados no editor
 */
router.post('/qualify', minutaController.qualificar);

export default router;