import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Garante que a pasta uploads existe
const uploadDir = path.resolve(process.cwd(), 'src/uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

export default upload;