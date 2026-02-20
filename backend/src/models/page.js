import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Page = sequelize.define('Page', {
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
    type: DataTypes.JSONB, // Estrutura de blocos do editor
    allowNull: false,
    defaultValue: [],
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Pages',
      key: 'id',
    },
  },
}, {
  tableName: 'Pages',
  timestamps: true,
});

// Associação para hierarquia
Page.hasMany(Page, { as: 'subPages', foreignKey: 'parentId' });
Page.belongsTo(Page, { as: 'parent', foreignKey: 'parentId' });