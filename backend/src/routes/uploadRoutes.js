import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const getBlockType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    return 'file'; // Para documentos, zips, etc.
};

router.post('/upload', upload.single('media'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const blockType = getBlockType(req.file.mimetype);

        res.json({
            success: true,
            type: blockType, // O frontend usa isso para decidir o componente
            url: fileUrl,
            data: {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                // Aqui você pode adicionar campos extras como 'caption' ou 'altText' futuramente
                title: req.file.originalname 
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro no upload de mídia.' });
    }
});

export default router;