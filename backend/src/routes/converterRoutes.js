import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { 
    convertReceitaSee, 
    convertGuiaSistema, 
    convertTabelaEmolumentos,
    convertGuiaCsv
} from '../controllers/converterController.js';

const router = express.Router();

router.post('/receita-see', upload.single('pdf'), convertReceitaSee);

router.post('/guia-sistema', upload.single('pdf'), convertGuiaSistema);

router.post('/tabela-emolumentos', upload.single('file'), convertTabelaEmolumentos);

router.post('/guia-csv', upload.single('file'), convertGuiaCsv);

export default router;