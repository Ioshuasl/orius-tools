import ibgeService from '../services/ibgeService.js';

export const listDistritos = async (req, res) => {
  try {
    const { uf, busca, apenasComarcas } = req.query;
    let dados = await ibgeService.getDadosLocais();

    // Filtro por UF (ex: ?uf=GO)
    if (uf) {
      dados = dados.filter(item => item.ufSigla.toUpperCase() === uf.toUpperCase());
    }

    // Filtro por busca textual (ex: ?busca=Anapolis)
    if (busca) {
      const termo = busca.toLowerCase();
      dados = dados.filter(item => 
        item.distritoNome.toLowerCase().includes(termo) || 
        item.municipioNome.toLowerCase().includes(termo)
      );
    }

    // Filtro para trazer apenas o que for comarca (ex: ?apenasComarcas=true)
    if (apenasComarcas === 'true') {
      dados = dados.filter(item => item.isComarca === true);
    }

    // Retorna os dados (limitando a 500 registros para não travar o navegador se não houver filtro)
    // Se quiser retornar tudo, remova o .slice(0, 500)
    return res.json(dados.slice(0, 500));
  } catch (error) {
    console.error('Erro no ibgeController:', error);
    return res.status(500).json({ error: 'Erro ao listar dados de localidades.' });
  }
};

export const sincronizarIbge = async (req, res) => {
  try {
    const resultado = await ibgeService.sincronizarDados();
    return res.json({ message: 'Sincronização realizada com sucesso!', info: resultado });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};