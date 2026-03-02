import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js'; // Ajuste o caminho conforme sua estrutura de pastas

const Cbo = sequelize.define('Cbo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    codigo: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Código CBO (ex: 6125-10 ou 2631)'
    },
    titulo: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Nome da ocupação ou sinônimo'
    },
    tipo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Ocupação, Sinônimo ou Família'
    }
}, {
    tableName: 'cbos',
    timestamps: true,
    underscored: true, // Usa snake_case (created_at) no banco de dados
    indexes: [
        {
            name: 'idx_cbo_codigo',
            fields: ['codigo']
        },
        {
            name: 'idx_cbo_titulo',
            fields: ['titulo']
        }
    ]
});

export default Cbo;