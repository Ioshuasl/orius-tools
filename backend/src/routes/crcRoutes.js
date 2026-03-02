import express from 'express';
import upload from '../middlewares/uploadMiddleware.js'; //
import * as crcController from '../controllers/crcController.js';

const router = express.Router();

// Rota de Validação Inicial
router.post('/validar', upload.single('file'), crcController.validarArquivoCrc);

// Rota de Correção e Re-validação
router.post('/corrigir', upload.single('file'), crcController.corrigirArquivoCrc);

export default router;