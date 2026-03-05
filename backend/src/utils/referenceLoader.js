import fs from 'fs';
import path from 'path';

export const loadReferenceMap = () => {
    // Como estamos em ES Modules, usamos process.cwd() para garantir o caminho correto a partir da raiz
    const jsonPath = path.resolve(process.cwd(), './src/codigo-descricao-tabela-emolumentos.json');

    if (!fs.existsSync(jsonPath)) {
        console.warn(`⚠️ AVISO: Tabela de referência não encontrada em: ${jsonPath}`);
        return new Map();
    }

    try {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);
        const map = new Map();
        data.forEach(item => {
            if (item.codigo && item.descricao_selo) {
                map.set(item.codigo, item.descricao_selo);
            }
        });
        console.log(`📚 Dicionário carregado com sucesso: ${map.size} atos.`);
        return map;
    } catch (error) {
        console.error('❌ Erro ao ler JSON de referência:', error.message);
        return new Map();
    }
};