import { Router } from 'express';
import * as ibgeController from '../controllers/ibgeController.js';

const router = Router();

// Rota para buscar os dados (com suporte a query params)
router.get('/distritos', ibgeController.listDistritos);

// Rota para forçar a atualização do ibge.json
router.post('/sincronizar', ibgeController.sincronizarIbge);

export default router;