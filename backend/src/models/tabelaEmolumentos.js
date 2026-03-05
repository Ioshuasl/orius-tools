import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const TabelaEmolumentos = sequelize.define('TabelaEmolumentos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Ex: Tabela Atualizada — 29/01/2026'
    },
    ano: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ativa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Define se esta versão é a que o sistema deve usar para novos cálculos'
    }
}, {
    tableName: 'tabelas_emolumentos',
    timestamps: true
});

export default TabelaEmolumentos;