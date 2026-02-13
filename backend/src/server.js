import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express'; // Importar UI
import converterRoutes from './routes/converterRoutes.js';
import { swaggerSpec } from './config/swagger.js'; // Importar Config

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações globais
app.use(cors());
app.use(express.json());

// Rota da Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/converter', converterRoutes);

// Rota de Health Check
app.get('/', (req, res) => {
    res.json({ 
        application: 'Orius Converter API', 
        status: 'online', 
        version: '1.0.0',
        docs: '/api-docs' // Link para a doc
    });
});

// Inicialização
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Orius Converter API rodando na porta ${PORT}`);
    console.log(`📄 Documentação Swagger: http://localhost:${PORT}/api-docs`);
    console.log(`=============================================`);
});