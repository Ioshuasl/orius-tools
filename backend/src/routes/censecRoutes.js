import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { validarCensecXml, corrigirCensecXml } from '../controllers/censecController.js';

const router = express.Router();

// Usando upload.single('file') para seguir o padrão dos outros conversores
router.post('/validar-cep', upload.single('file'), validarCensecXml);

router.post('/corrigir-cep', upload.any(), corrigirCensecXml);

export default router;