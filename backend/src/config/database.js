import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da instância do Sequelize
export const sequelize = new Sequelize(
    process.env.DB_NAME || 'orius_tools',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'orius_admin',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Desative logs no console para manter o terminal limpo
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);