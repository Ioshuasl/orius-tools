import Editor from '@monaco-editor/react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { TextBlock } from './TextBlock';
import { TableBlock } from '../TableBlock';
import { PageBlock } from '../PageBlock';
import { uploadMediaService } from '../../services/api';
import type { Block, BlockType } from '../../types';

interface BlockRendererProps {
  block: Block;
  index: number;
  updateBlock: (id: string, data: any) => void;
  updateBlockType: (newType: string) => void;
  addBlock: (type: BlockType | 'page', index?: number) => void;
  focusBlockId: string | null;
  onSlash: (rect: DOMRect) => void;
  navigate: (path: string) => void;
}

export function BlockRenderer({
  block,
  index,
  updateBlock,
  updateBlockType,
  addBlock,
  focusBlockId,
  onSlash,
  navigate
}: BlockRendererProps) {

  const isFocused = focusBlockId === block.id;

  switch (block.type) {

    // 1. BLOCO DE TEXTO (Padrão, sem marcadores)
    case 'text':
      return (
        <TextBlock
          initialHtml={block.data.text}
          placeholder="Digite '/' para comandos..."
          onUpdate={(html) => updateBlock(block.id, { text: html })}
          onUpdateType={updateBlockType}
          onEnter={() => addBlock('text', index)} // Enter em texto sempre cria novo texto
          onSlash={onSlash}
          autoFocus={isFocused}
        />
      );

    // 2. LISTA NÃO NUMERADA (Com bullet)
    case 'bullet_list':
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none mb-1">
          <TextBlock
            initialHtml={block.data.text}
            placeholder="Item da lista..."
            className="list-disc ml-6" // Classe para CSS de marcador e recuo
            onUpdate={(html) => updateBlock(block.id, { text: html })}
            onUpdateType={updateBlockType}
            onEnter={(type?: BlockType) => addBlock(type || 'bullet_list', index)}
            onSlash={onSlash}
            autoFocus={isFocused}
          />
        </div>
      );

    // 3. LISTA NUMERADA (Com números)
    case 'numbered_list':
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none mb-1">
          <TextBlock
            initialHtml={block.data.text}
            placeholder="Item da lista..."
            className="list-decimal ml-6" // Classe para CSS de numeração e recuo
            onUpdate={(html) => updateBlock(block.id, { text: html })}
            onUpdateType={updateBlockType}
            onEnter={(type?: BlockType) => addBlock(type || 'numbered_list', index)}
            onSlash={onSlash}
            autoFocus={isFocused}
          />
        </div>
      );

    // 4. CABEÇALHOS (H1, H2, H3) - Usando TextBlock para Shift+Enter
    case 'h1':
    case 'h2':
    case 'h3':
      return (
        <TextBlock
          initialHtml={block.data.text}
          placeholder="Título"
          className={`font-black text-gray-900 dark:text-white ${block.type === 'h1' ? 'text-3xl tracking-tight' :
            block.type === 'h2' ? 'text-2xl' : 'text-xl'
            }`}
          onUpdate={(html) => updateBlock(block.id, { text: html })}
          onUpdateType={updateBlockType}
          onEnter={() => addBlock('text', index)} // Título sempre gera texto abaixo
          onSlash={onSlash}
          autoFocus={isFocused}
        />
      );

    // 5. SUBPÁGINA
    case 'page' as any:
      return (
        <PageBlock
          title={block.data.title}
          onClick={() => navigate(`/comunidade/editor/${block.data.pageId}`)}
        />
      );

    // 6. TABELA
    case 'table':
      return (
        <TableBlock
          block={block}
          onUpdate={(d) => updateBlock(block.id, d)}
          onEnterLastCell={() => addBlock('text', index)}
        />
      );

    // 7. EDITOR DE CÓDIGO
    case 'code':
      // Lista de linguagens suportadas
      const languages = [
        { label: 'SQL', value: 'sql' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'JSON', value: 'json' },
      ];

      return (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 my-4 bg-[#1e1e1e] group/code">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Editor de Código
            </span>

            {/* Seletor de Linguagem */}
            <select
              value={block.data.language || 'sql'}
              onChange={(e) => updateBlock(block.id, { language: e.target.value })}
              className="bg-transparent text-[10px] font-bold text-orange-500 uppercase outline-none cursor-pointer hover:text-orange-600 transition-colors"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <Editor
            height="200px"
            theme="vs-dark"
            language={block.data.language || 'sql'} // Agora dinâmico
            value={block.data.text}
            onChange={(v) => updateBlock(block.id, { text: v })}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              padding: { top: 10, bottom: 10 }
            }}
          />
        </div>
      );

    // 8. MÍDIAS
    case 'image':
    case 'video':
      return (
        <div className="my-2 group/media relative">
          {block.data.url ? (
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black relative group">
              {block.type === 'image' ? (
                <img src={`http://localhost:3000${block.data.url}`} className="w-full h-auto max-h-[600px] object-contain" alt="Content" />
              ) : (
                <video src={`http://localhost:3000${block.data.url}`} controls className="w-full max-h-[600px]" />
              )}
              <button
                onClick={() => updateBlock(block.id, { url: "" })}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-orange-500 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
              <ImageIcon size={32} className="text-gray-300 mb-2" />
              <input
                type="file"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    const { url } = await uploadMediaService(e.target.files[0]);
                    updateBlock(block.id, { url });
                  }
                }}
              />
            </label>
          )}
        </div>
      );

    default:
      return null;
  }
}