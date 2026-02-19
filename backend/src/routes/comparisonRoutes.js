import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { realizarComparacaoCompleta } from '../controllers/comparisonController.js';

const router = express.Router();

// Configuração para aceitar múltiplos campos de arquivo
// O frontend deve enviar um form-data com keys: 'pdf' e 'csv'
const uploadFields = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'csv', maxCount: 1 }
]);

router.post('/comparar-guias', uploadFields, realizarComparacaoCompleta);

export default router;