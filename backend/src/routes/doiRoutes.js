import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { 
    validarDoiJson, 
    corrigirDoiJson 
} from '../controllers/doiController.js';

const router = express.Router();

/**
 * ROTAS PARA DOI (Declaração sobre Operações Imobiliárias)
 * Focado em operações de compra, venda, doação e permuta de imóveis.
 * Suporta arquivos no formato .json conforme manual da Receita Federal.
 */

// Rota para validação inicial do lote de declarações
// Espera um único arquivo no campo 'file'
router.post('/validar-doi', upload.single('file'), validarDoiJson);

// Rota para aplicar correções e higienização (Delphi)
// Usa upload.any() para suportar o arquivo original + o JSON de correções no body
router.post('/corrigir-doi', upload.any(), corrigirDoiJson);

export default router;