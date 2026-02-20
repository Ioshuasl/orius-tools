import express from 'express';
import * as communityController from '../controllers/communityController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', upload.single('media'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        // Gera a URL que o Frontend vai salvar no JSON do bloco
        // Em ambiente local: http://localhost:3000/uploads/nome-do-arquivo.mp4
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no upload de mídia.' });
    }
});

router.post('/pages', communityController.createPage);
// Alterado de getPages para getPublications
router.get('/pages/:id/breadcrumbs', communityController.getBreadcrumbs);
router.get('/pages', communityController.getPublications); 
// Alterado de getPageById para getPageDetail
router.get('/pages/:id', communityController.getPageDetail); 
router.put('/pages/:id', communityController.updatePage);
router.delete('/pages/:id', communityController.deletePage);

export default router;