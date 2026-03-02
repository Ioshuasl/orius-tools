// teste-ibge.js
import ibgeService from './src/services/ibgeService.js';

async function testarServico() {
  try {
    console.log('--- Iniciando Teste de Sincronização ---');
    const sync = await ibgeService.sincronizarDados();
    console.log('Resultado Sync:', sync);

    console.log('\n--- Lendo Dados Locais ---');
    const dados = await ibgeService.getDadosLocais();

    // Validando um caso específico (Anápolis/Souzânia)
    const souzania = dados.find(d => d.distritoNome === 'Souzânia');
    const goiania = dados.find(d => d.distritoNome === 'Goiânia' && d.municipioNome === 'Goiânia');

    console.log('\nVerificando Souzânia (Deve ser isComarca: true):');
    console.log(souzania);

    console.log('\nVerificando Goiânia (Deve ser isComarca: false):');
    console.log(goiania);

    if (souzania?.isComarca === true && goiania?.isComarca === false) {
      console.log('\n✅ SUCESSO: A lógica de Comarca está correta!');
    } else {
      console.log('\n❌ ERRO: A lógica de Comarca falhou.');
    }

  } catch (error) {
    console.error('Falha no teste:', error);
  }
}

testarServico();