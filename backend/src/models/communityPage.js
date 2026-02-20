import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CommunityPage = sequelize.define('CommunityPage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    system: {
        type: DataTypes.ENUM(
            'TABELIONATO DE NOTAS',
            'PROTESTO DE TÍTULOS',
            'REGISTRO CIVIL',
            'REGISTRO DE IMÓVEIS',
            'REGISTRO DE TÍTULOS E DOCUMENTO',
            'CAIXA',
            'NOTA FISCAL'
        ),
        allowNull: true,
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
    },
    content: {
        type: DataTypes.JSONB, // Array de blocos do editor
        allowNull: false,
        defaultValue: [],
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'CommunityPages',
            key: 'id',
        },
    },
}, {
    tableName: 'CommunityPages',
    timestamps: true,
});

// Auto-relacionamento para hierarquia (Página pai -> Subpáginas)
CommunityPage.hasMany(CommunityPage, { as: 'subPages', foreignKey: 'parentId', onDelete: 'CASCADE' });
CommunityPage.belongsTo(CommunityPage, { as: 'parent', foreignKey: 'parentId' });