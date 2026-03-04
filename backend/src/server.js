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
import cenprotRoutes from './routes/cenprotRoutes.js';
import minutaRoutes from './routes/minutaRoutes.js';
import cboRoutes from './routes/cboRoutes.js';
import crcRoutes from './routes/crcRoutes.js';
import ibgeRoutes from './routes/ibgeRoutes.js';
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
// Aumente o limite para o parser de JSON
app.use(express.json({ limit: '50mb' }));

// Também é recomendável aumentar para o urlencoded, caso use
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rota da Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/converter', converterRoutes);
app.use('/api/comparar', comparisonRoutes);
app.use('/api/censec', censecRoutes);
app.use('/api/doi', doiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/cenprot', cenprotRoutes);
app.use('/api/minutas', minutaRoutes);
app.use('/api/cbo', cboRoutes);
app.use('/api/crc', crcRoutes);
app.use('/api/ibge', ibgeRoutes);

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
 * Inicialização com verificação detalhada de Banco de Dados
 */
async function startServer() {
    try {
        // 1. Autenticação com o PostgreSQL
        console.log('⏳ Tentando conectar ao PostgreSQL...');
        try {
            await sequelize.authenticate();
            console.log('\n\x1b[32m%s\x1b[0m', '  ✅ Conexão com o PostgreSQL estabelecida com sucesso.');
        } catch (authError) {
            console.error('\n\x1b[31m%s\x1b[0m', '  ❌ ERRO DE AUTENTICAÇÃO:');
            console.error('     Verifique suas credenciais no .env (DB_USER, DB_PASS, DB_HOST).');
            console.error(`     Mensagem: ${authError.message}`);
            process.exit(1); // Encerra o processo pois sem banco nada funciona
        }

        // 2. Sincronização dos modelos
        console.log('⏳ Sincronizando modelos...');
        try {
            // Se estiver em desenvolvimento e mudar o model, o 'alter: true' tenta ajustar a tabela
            await sequelize.sync({ alter: true });
            console.log('\x1b[32m%s\x1b[0m', '  ✅ Modelos sincronizados com o banco de dados.');
        } catch (syncError) {
            console.error('\n\x1b[31m%s\x1b[0m', '  ❌ ERRO DE SINCRONIZAÇÃO:');
            console.error('     Houve um conflito entre seus Models e as tabelas existentes.');
            console.error(`     Mensagem: ${syncError.message}`);
            
            // Dica amigável para resolver o conflito
            console.log('\x1b[33m%s\x1b[0m', '  💡 Dica: Se você mudou campos do CBO, tente usar { force: true } uma vez (CUIDADO: apaga os dados).');
            process.exit(1);
        }

        const localIp = getLocalIp();

        // 3. Inicia o servidor
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   http://localhost:\x1b[1m${PORT}\x1b[0m/`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mRede:\x1b[0m    http://${localIp}:\x1b[1m${PORT}\x1b[0m/`);
            console.log(`\n  \x1b[36mSwagger UI:\x1b[0m http://localhost:${PORT}/api-docs\n`);
        });

    } catch (error) {
        console.error('\n\x1b[31m%s\x1b[0m', '  💥 ERRO FATAL AO INICIAR O SERVIDOR:');
        console.error(error);
        process.exit(1);
    }
}

startServer();