import fs from 'fs';
import { sequelize } from '../config/database.js'; //
import TabelaEmolumentos from '../models/TabelaEmolumentos.js';
import RegistroTabelaEmolumentos from '../models/RegistroTabelaEmolumentos.js';
import { processarTabelaExcel } from '../services/excelService.js'; //

/**
 * 1. Importa a tabela via Excel, vincula ao nome fornecido pelo usuário
 * e realiza o cadastro em massa (Bulk Insert) dos registros.
 */
export const importTabelaXlsx = async (req, res) => {
    const { nomeTabela } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo Excel (.xlsx) enviado.' });
    }

    if (!nomeTabela || nomeTabela.trim() === '') {
        // Limpeza do arquivo temporário em caso de erro de validação
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'O nome da tabela é obrigatório para a identificação.' });
    }

    // Iniciamos uma transação para garantir atomicidade entre Tabela e Registros
    const t = await sequelize.transaction();

    try {
        console.log(`📥 [Orius] Iniciando processamento de: ${nomeTabela}`);
        
        // Extração de dados via serviço Excel
        const registrosExtraidos = await processarTabelaExcel(req.file.path);

        if (!registrosExtraidos || registrosExtraidos.length === 0) {
            throw new Error("O arquivo Excel foi processado, mas nenhum registro válido foi encontrado.");
        }

        // O ano é capturado automaticamente da célula B5 pelo excelService
        const anoVigencia = registrosExtraidos[0].ano_tabela;

        // 1. Desativamos versões anteriores do mesmo ano para garantir que apenas uma seja a 'Ativa'
        await TabelaEmolumentos.update(
            { ativa: false }, 
            { 
                where: { ano: anoVigencia, ativa: true },
                transaction: t 
            }
        );

        // 2. Criamos o cabeçalho (TabelaEmolumentos)
        const novaTabela = await TabelaEmolumentos.create({
            nome: nomeTabela,
            ano: anoVigencia,
            ativa: true
        }, { transaction: t });

        // 3. Mapeamos os registros injetando a chave estrangeira (tabela_id)
        const registrosParaSalvar = registrosExtraidos.map(reg => ({
            tabela_id: novaTabela.id,
            id_selo: reg.id_selo,
            ano_tabela: reg.ano_tabela,
            descricao_selo: reg.descricao_selo,
            faixa_cotacao: reg.faixa_cotacao,
            valor_emolumento: reg.valor_emolumento,
            valor_taxa_judiciaria: reg.valor_taxa_judiciaria,
            id_selo_combinado: reg.id_selo_combinado,
            sistema: reg.sistema,
            // Campos específicos de protesto/faixas
            ato: reg.ato || null,
            condicao_especial: reg.condicao_especial || null,
            condicao_pagamento: reg.condicao_pagamento || null,
            faixa_valor_inicio: reg.faixa_valor_inicio || 0,
            faixa_valor_fim: reg.faixa_valor_fim || null
        }));

        // 4. Inserção de alta performance para os 1500+ registros
        await RegistroTabelaEmolumentos.bulkCreate(registrosParaSalvar, { transaction: t });

        // Confirmamos todas as operações no banco de dados
        await t.commit();
        
        console.log(`✅ Sucesso! Tabela "${nomeTabela}" criada com ${registrosParaSalvar.length} registros.`);

        res.status(201).json({
            success: true,
            tabela_id: novaTabela.id,
            nome: novaTabela.nome,
            ano: novaTabela.ano,
            total_registros: registrosParaSalvar.length
        });

    } catch (error) {
        // Se houver qualquer falha, o rollback desfaz tudo o que foi tentado na transação
        if (t) await t.rollback();
        console.error('❌ Erro na importação da tabela:', error);
        res.status(500).json({ error: 'Erro ao processar e salvar a tabela.', details: error.message });
    } finally {
        // Sempre removemos o arquivo após o processamento, independente do sucesso
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
};

/**
 * 2. Retorna a lista de todas as tabelas cadastradas (cabeçalhos apenas).
 */
export const getAllTabelas = async (req, res) => {
    try {
        const tabelas = await TabelaEmolumentos.findAll({
            attributes: ['id', 'nome', 'ano', 'ativa', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json(tabelas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar as tabelas de emolumentos.' });
    }
};

/**
 * 3. Retorna os detalhes de uma tabela específica e todos os seus 1500+ registros.
 */
export const getTabelaById = async (req, res) => {
    const { id } = req.params;

    try {
        const tabela = await TabelaEmolumentos.findByPk(id, {
            include: [{
                model: RegistroTabelaEmolumentos,
                as: 'registros'
            }]
        });

        if (!tabela) {
            return res.status(404).json({ error: 'Tabela de emolumentos não encontrada.' });
        }

        res.json(tabela);
    } catch (error) {
        console.error('❌ Erro ao buscar registros da tabela:', error);
        res.status(500).json({ error: 'Erro ao recuperar os dados da tabela.' });
    }
};