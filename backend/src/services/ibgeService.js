import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração para emular o __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definindo o caminho onde o JSON será salvo (na raiz de src ou em uma pasta data)
const JSON_FILE_PATH = path.join(__dirname, '../ibge.json');

const ibgeService = {
  /**
   * Busca os dados da API do IBGE, processa e salva em um arquivo local .json
   */
  async sincronizarDados() {
    try {
      console.log('Iniciando sincronização com IBGE...');
      const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/distritos?view=nivelado';
      const { data } = await axios.get(url);

      const dadosFormatados = data.map(item => {
        const distritoNome = item['distrito-nome'];
        const municipioNome = item['municipio-nome'];
        
        // Regra: se distrito != municipio, então é uma comarca (distrito dependente)
        const isComarca = distritoNome !== municipioNome;

        return {
          distritoNome,
          municipioId: item['municipio-id'],
          municipioNome,
          ufSigla: item['UF-sigla'],
          ufNome: item['UF-nome'],
          isComarca
        };
      });

      // Salva o arquivo JSON formatado (null, 2 serve para identação)
      await fs.writeFile(JSON_FILE_PATH, JSON.stringify(dadosFormatados, null, 2), 'utf-8');
      
      console.log(`Dados salvos com sucesso em: ${JSON_FILE_PATH}`);
      return { success: true, count: dadosFormatados.length };
    } catch (error) {
      console.error('Erro ao sincronizar dados do IBGE:', error.message);
      throw new Error('Falha ao gerar arquivo ibge.json');
    }
  },

  /**
   * Lê os dados do arquivo ibge.json local
   */
  async getDadosLocais() {
    try {
      const data = await fs.readFile(JSON_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir, tenta sincronizar primeiro
      if (error.code === 'ENOENT') {
        console.log('Arquivo ibge.json não encontrado. Iniciando primeira sincronização...');
        await this.sincronizarDados();
        return this.getDadosLocais();
      }
      throw error;
    }
  }
};

export default ibgeService;