import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { 
    validarCepXml, 
    corrigirCepXml, 
    validarCesdiXml, 
    corrigirCesdiXml 
} from '../controllers/censecController.js';

const router = express.Router();

/**
 * ROTAS PARA CEP (Cartão de Assinaturas / Escrituras)
 * Focado em validação de atos notariais diversos.
 */

// Upload único para validação inicial
router.post('/validar-cep', upload.single('file'), validarCepXml);

// Upload múltiplo (any) para suportar o arquivo + JSON de correções
router.post('/corrigir-cep', upload.any(), corrigirCepXml);


/**
 * ROTAS PARA CESDI (Separações, Divórcios e Inventários)
 * Focado em regras de família, sucessões e presença de advogados.
 */

// Upload único para validação inicial
router.post('/validar-cesdi', upload.single('file'), validarCesdiXml);

// Upload múltiplo (any) para suportar o arquivo + JSON de correções
router.post('/corrigir-cesdi', upload.any(), corrigirCesdiXml);

export default router;