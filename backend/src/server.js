import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path'; // <--- ADICIONE ESTE IMPORT
import { sequelize } from './config/database.js'; // Importando a conexão

// Importação das Rotas
import converterRoutes from './routes/converterRoutes.js';
import comparisonRoutes from './routes/comparisonRoutes.js';
import censecRoutes from './routes/censecRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import { swaggerSpec } from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações globais
app.use(cors());
app.use(express.json());

// Rota da Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/converter', converterRoutes);
app.use('/api/comparar', comparisonRoutes);
app.use('/api/censec', censecRoutes);
app.use('/api/community', communityRoutes);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Rota de Health Check
app.get('/', (req, res) => {
    res.json({ 
        application: 'Orius Tools API', 
        status: 'online', 
        db_connected: true,
        version: '1.1.0'
    });
});

/**
 * Inicialização com verificação de Banco de Dados
 */
async function startServer() {
    try {
        // 1. Tenta autenticar a conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

        // 2. Sincroniza os modelos (cria tabelas conforme as definições)
        // alter: true permite atualizar colunas existentes sem apagar dados
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados com o banco de dados.');

        // 3. Inicia o servidor Express
        app.listen(PORT, () => {
            console.log(`=============================================`);
            console.log(`🚀 Orius Tools API rodando na porta ${PORT}`);
            console.log(`📄 Documentação: http://localhost:${PORT}/api-docs`);
            console.log(`=============================================`);
        });
    } catch (error) {
        console.error('❌ Não foi possível conectar ao banco de dados:', error);
        process.exit(1); // Encerra a aplicação caso o banco não esteja disponível
    }
}

startServer();