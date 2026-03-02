import * as crcService from '../services/crcService.js';
import fs from 'fs';
import path from 'path';

/**
 * Controller para gerenciar o upload e validação de arquivos CRC (XML)
 */
export const validarArquivoCrc = async (req, res) => {
    // 1. Verifica se o arquivo foi enviado (assumindo o uso de multer ou similar)
    if (!req.file) {
        return res.status(400).json({
            sucesso: false,
            erros: [{ mensagemDeErro: "Nenhum arquivo foi enviado.", tipoDeErro: "Upload" }]
        });
    }

    const filePath = req.file.path;

    try {
        // 2. Chama o serviço de validação refatorado
        const resultado = await crcService.validarXmlCrc(filePath);

        // 3. Retorna a resposta conforme o padrão cenprotService (agrupado por movimentos)
        // Mesmo que haja erros de negócio, retornamos 200 para o frontend tratar visualmente
        return res.status(200).json(resultado);

    } catch (error) {
        console.error("Erro Crítico no CRC Controller:", error);
        return res.status(500).json({
            sucesso: false,
            totalRegistros: 0,
            erros: [{ 
                mensagemDeErro: `Erro interno no servidor: ${error.message}`, 
                tipoDeErro: "Sistema" 
            }]
        });
    } finally {
        // 4. LIMPEZA: Sempre remove o arquivo temporário do servidor após o processamento
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Erro ao deletar arquivo temporário: ${filePath}`, err);
            });
        }
    }
};

export const corrigirArquivoCrc = async (req, res) => {
    const filePath = req.file.path;
    const correcoes = JSON.parse(req.body.correcoes || '[]');

    try {
        // 1. Gera o novo conteúdo XML
        const xmlCorrigido = await crcService.corrigirXmlCrc(filePath, correcoes);

        // 2. Salva temporariamente para re-validar antes de enviar
        const tempPath = `${filePath}_corrigido.xml`;
        fs.writeFileSync(tempPath, xmlCorrigido);

        // 3. Re-valida para informar ao usuário se ainda restam erros
        const validacao = await crcService.validarXmlCrc(tempPath);

        // 4. Configura os headers de validação (Padrão que você usa no CENSEC)
        res.setHeader('x-validation-success', validacao.sucesso.toString());
        res.setHeader('x-validation-errors', validacao.erros.length.toString());
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=crc_corrigido.xml');

        // 5. Envia o arquivo e limpa o temporário
        return res.send(xmlCorrigido);

    } catch (error) {
        return res.status(500).json({ sucesso: false, mensagemDeErro: error.message });
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
};