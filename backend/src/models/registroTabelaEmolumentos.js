import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js'; //
import TabelaEmolumentos from './TabelaEmolumentos.js';

const RegistroTabelaEmolumentos = sequelize.define('RegistroTabelaEmolumentos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tabela_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TabelaEmolumentos,
            key: 'id'
        }
    },
    id_selo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ano_tabela: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    descricao_selo: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sistema: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    // Valores Financeiros
    faixa_cotacao: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    valor_emolumento: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    valor_taxa_judiciaria: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    id_selo_combinado: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Campos Específicos de Protesto e Faixas
    ato: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    condicao_especial: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    condicao_pagamento: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    faixa_valor_inicio: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    faixa_valor_fim: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    }
}, {
    tableName: 'registros_tabela_emolumentos',
    timestamps: false, // Otimização para tabelas grandes de consulta
    indexes: [
        {
            fields: ['tabela_id', 'id_selo', 'sistema']
        }
    ]
});

// Definindo a relação
TabelaEmolumentos.hasMany(RegistroTabelaEmolumentos, { foreignKey: 'tabela_id', as: 'registros' });
RegistroTabelaEmolumentos.belongsTo(TabelaEmolumentos, { foreignKey: 'tabela_id' });

export default RegistroTabelaEmolumentos;