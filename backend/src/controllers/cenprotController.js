import * as cenprotService from '../services/cenprotService.js';
import fs from 'fs';

export const validarLote = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Nenhum arquivo XML foi enviado para processamento." 
            });
        }

        const resultadosLote = {
            totalArquivosProcessados: req.files.length,
            totalTitulosGeral: 0,
            apresentantes: [], // Consolidação de todos os arquivos
            erros: []
        };

        // Processa cada arquivo individualmente
        for (const file of req.files) {
            const resultado = await cenprotService.validarXmlCenprot(file.path);
            
            // Consolida os dados para o Frontend
            resultadosLote.totalTitulosGeral += resultado.totalTitulos;
            resultadosLote.erros.push(...resultado.erros);
            
            // Mescla os apresentantes (evitando duplicados visualmente se necessário)
            resultadosLote.apresentantes.push(...resultado.apresentantes);

            // Remove o arquivo físico imediatamente
            fs.unlinkSync(file.path);
        }

        return res.status(200).json({
            sucesso: resultadosLote.erros.length === 0,
            ...resultadosLote
        });

    } catch (error) {
        // Limpeza de emergência em caso de erro no loop
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao processar o lote de arquivos CENPROT.",
            detalhes: error.message
        });
    }
};