import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Alteração estratégica: Pasta na raiz do projeto (fora de /src) é melhor para persistência em Docker
const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de Armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Gera um sufixo único para evitar sobrescrita de arquivos com nomes iguais
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Mantém a extensão original (ex: .png, .mp4)
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Filtro de segurança (Opcional, mas recomendado para escalabilidade)
const fileFilter = (req, file, cb) => {
    // Lista de extensões permitidas para a Comunidade e Conversores
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.mp4', '.mov','.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado.'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // Limite de 50MB para suportar vídeos curtos de instrução
    }
});

export default upload;