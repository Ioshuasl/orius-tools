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

router.post('/', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  
  // Retorna a URL local para o frontend salvar no JSON do bloco
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;