import { useState, useEffect } from 'react';
import { TextBlock } from './TextBlock';
import { TableBlock } from '../TableBlock';
import { PageBlock } from '../PageBlock';
import { CodeBlock } from './CodeBlock';

// Componentes modulares
import { ImageBlock } from './ImageBlock';
import { VideoBlock } from './VideoBlock';
import { FileBlock } from './FileBlock';

import { uploadMediaService } from '../../services/api';
import type { Block, BlockType } from '../../types';
import { toast } from 'sonner';
import { generatePdfThumbnail } from '../../utils/pdfPreviewHandler';
import { DiagramBlock } from './DiagramBlock';
import { MindMapBlock } from './MindMapBlock';

interface BlockRendererProps {
  block: Block;
  index: number;
  allBlocks: Block[];
  updateBlock: (id: string, data: any, immediate?: boolean) => void;
  updateBlockType: (id: string, type: string) => void;
  addBlock: (type: BlockType | 'page', index?: number, shouldReplace?: boolean) => void;
  focusBlockId: string | null;
  onSlash: (rect: DOMRect, mode: 'replace' | 'add') => void;
  onMoveFocus: (direction: 'up' | 'down') => void;
  onBackspaceEmpty?: () => void;
  navigate: (path: string) => void;
}

export function BlockRenderer({
  block,
  index,
  allBlocks,
  updateBlock,
  updateBlockType,
  addBlock,
  focusBlockId,
  onSlash,
  onMoveFocus,
  onBackspaceEmpty,
  navigate
}: BlockRendererProps) {

  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estado local para metadados instantâneos
  const [localMeta, setLocalMeta] = useState<{ name: string, size: number } | null>(null);

  const isFocused = focusBlockId === block.id;

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleMediaUpload = async (file: File) => {
    // 1. Início do processo e feedback visual imediato
    try {
      setLocalMeta({ name: file.name, size: file.size });
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsUploading(true);

      // 2. Geração do Thumbnail (Exclusivo para PDFs)
      // Geramos a imagem da primeira página antes de iniciar o upload para garantir a captura
      let pdfThumbnail: string | null = null;
      if (file.type === 'application/pdf') {
        pdfThumbnail = await generatePdfThumbnail(file);
      }

      // 3. Atualização Preventiva (UI Optimística)
      // Atualizamos o bloco com os metadados conhecidos e o thumbnail gerado
      // Isso permite que o FileBlock já exiba o preview enquanto o upload acontece
      updateBlock(block.id, {
        filename: file.name,
        size: file.size,
        mimetype: file.type,
        thumbnail: pdfThumbnail // Preview local em Base64
      });

      // 4. Upload para o Servidor
      const response = await uploadMediaService(file);

      if (response.success && response.url) {
        // 5. Sincronização Final e Persistência
        // Salvamos a URL permanente e mantemos o thumbnail para evitar regeneração futura
        // O terceiro parâmetro 'true' dispara o salvamento imediato e histórico
        updateBlock(block.id, {
          url: response.url,
          filename: response.filename || file.name,
          size: file.size,
          mimetype: response.mimetype || file.type,
          thumbnail: pdfThumbnail
        }, true);

        toast.success("Arquivo enviado com sucesso!");
      } else {
        throw new Error("O servidor não retornou uma URL válida.");
      }
    } catch (error) {
      console.error("Falha no upload:", error);
      toast.error("Erro ao processar o upload do arquivo.");

      // Limpeza de estados de erro
      setPreviewUrl(null);
      setLocalMeta(null);
    } finally {
      setIsUploading(false);
    }
  };

  const getNumberedListIndex = () => {
    let displayIndex = 1;
    for (let i = index - 1; i >= 0; i--) {
      if (allBlocks[i].type === 'numbered_list') displayIndex++;
      else break;
    }
    return displayIndex;
  };

  const textProps = {
    onUpdate: (html: string) => updateBlock(block.id, { text: html }),
    onUpdateType: (type: BlockType) => updateBlockType(block.id, type),
    onSlash: (rect: DOMRect) => onSlash(rect, 'replace'),
    onMoveFocus,
    onBackspaceEmpty,
    autoFocus: isFocused,
  };

  switch (block.type) {
    case 'text':
      return <TextBlock {...textProps} initialHtml={block.data.text} blockType={block.type} onEnter={() => addBlock('text', index, false)} />;

    case 'bullet_list':
      return (
        <div className="flex items-start gap-2 mb-1">
          <span className="text-gray-400 mt-1.5 font-bold select-none ml-2">•</span>
          <TextBlock {...textProps} initialHtml={block.data.text} blockType={block.type} onEnter={(type) => addBlock(type || 'bullet_list', index, false)} />
        </div>
      );

    case 'numbered_list':
      return (
        <div className="flex items-start gap-2 mb-1">
          <span className="text-gray-400 mt-1 min-w-[1.2rem] text-right font-medium select-none text-sm">{getNumberedListIndex()}.</span>
          <TextBlock {...textProps} initialHtml={block.data.text} blockType={block.type} onEnter={(type) => addBlock(type || 'numbered_list', index, false)} />
        </div>
      );

    case 'h1':
    case 'h2':
    case 'h3':
      return (
        <TextBlock
          {...textProps}
          initialHtml={block.data.text}
          blockType={block.type}
          className={`font-black text-gray-900 dark:text-white ${block.type === 'h1' ? 'text-3xl' : block.type === 'h2' ? 'text-2xl' : 'text-xl'}`}
          onEnter={() => addBlock('text', index, false)}
        />
      );

    case 'code':
      return <CodeBlock data={block.data} onUpdate={(d: any) => updateBlock(block.id, d)} />;

    case 'table':
      return <TableBlock data={block.data} onUpdate={(d: any) => updateBlock(block.id, d)} />;

    case 'page' as any:
      return <PageBlock title={block.data.title} onClick={() => navigate(`/comunidade/editor/${block.data.pageId}`)} />;

    case 'image':
      return (
        <ImageBlock
          key={block.data.url || previewUrl || 'empty-img'}
          data={block.data}
          previewUrl={previewUrl}
          isUploading={isUploading}
          onUpdate={(d: any) => updateBlock(block.id, d)}
          onUpload={handleMediaUpload}
        />
      );

    case 'video':
      return (
        <VideoBlock
          key={block.data.url || previewUrl || 'empty-video'}
          data={block.data}
          previewUrl={previewUrl}
          isUploading={isUploading}
          onUpdate={(d: any) => updateBlock(block.id, d)}
          onUpload={handleMediaUpload}
        />
      );

    case 'file':
      return (
        <FileBlock
          key={block.data.url || previewUrl || 'empty-file'}
          data={block.data}
          localMeta={localMeta}
          previewUrl={previewUrl}
          isUploading={isUploading}
          onUpdate={(d: any) => updateBlock(block.id, d)}
          onUpload={handleMediaUpload}
        />
      );

    case 'diagram':
      return (
        <div className="w-full my-6 block-diagram-wrapper">
          <DiagramBlock
            data={block.data}
            onUpdate={(newData) => updateBlock(block.id, newData)}
          />
        </div>
      );

    case 'mindmap':
      return (
        <div className="w-full my-6">
          <MindMapBlock
            id={block.id}
            data={block.data}
            updateBlock={updateBlock}
          />
        </div>
      );

    default:
      return null;
  }
}