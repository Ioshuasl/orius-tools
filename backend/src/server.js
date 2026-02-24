import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import os from 'os'; // Módulo nativo para detectar interfaces de rede
import { sequelize } from './config/database.js';

// Importação das Rotas
import converterRoutes from './routes/converterRoutes.js';
import comparisonRoutes from './routes/comparisonRoutes.js';
import censecRoutes from './routes/censecRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import doiRoutes from './routes/doiRoutes.js'
import { swaggerSpec } from './config/swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Função para capturar o IP da rede local (estilo Vite)
 */
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Filtra por IPv4 e ignora o endereço interno (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Configurações globais
app.use(cors({
    // Permite que o frontend leia os headers de validação do XML
    exposedHeaders: ['X-Validation-Success', 'X-Validation-Errors'],
}));
app.use(express.json());

// Rota da Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/converter', converterRoutes);
app.use('/api/comparar', comparisonRoutes);
app.use('/api/censec', censecRoutes);
app.use('/api/doi', doiRoutes);
app.use('/api/community', communityRoutes);

// Servir arquivos estáticos da pasta uploads
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
 * Inicialização com verificação de Banco de Dados e Exposição na Rede
 */
async function startServer() {
    try {
        // 1. Autenticação com o PostgreSQL
        await sequelize.authenticate();
        console.log('\n\x1b[32m%s\x1b[0m', '  ✅ Conexão com o PostgreSQL estabelecida.');

        // 2. Sincronização dos modelos
        await sequelize.sync({ alter: true });
        console.log('\x1b[32m%s\x1b[0m', '  ✅ Modelos sincronizados com o banco de dados.');

        const localIp = getLocalIp();

        // 3. Inicia o servidor escutando em '0.0.0.0' para expor na rede
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   http://localhost:\x1b[36m${PORT}\x1b[0m/`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m http://${localIp}:\x1b[36m${PORT}\x1b[0m/`);
            console.log(`\n  \x1b[90mDocumentação disponível em: http://${localIp}:${PORT}/api-docs\x1b[0m\n`);
        });

    } catch (error) {
        console.error('\n\x1b[31m%s\x1b[0m', '  ❌ Erro ao iniciar o servidor:', error.message);
        process.exit(1); 
    }
}

startServer();