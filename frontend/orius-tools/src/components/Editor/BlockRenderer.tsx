import Editor from '@monaco-editor/react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { TextBlock } from './TextBlock';
import { TableBlock } from '../TableBlock';
import { PageBlock } from '../PageBlock';
import { uploadMediaService } from '../../services/api';
import type { Block, BlockType } from '../../types';
import { CodeBlock } from './CodeBlock';

interface BlockRendererProps {
  block: Block;
  index: number;
  allBlocks: Block[];
  updateBlock: (id: string, data: any) => void;
  updateBlockType: (id: string, type: string) => void;
  addBlock: (type: BlockType | 'page', index?: number, shouldReplace?: boolean) => void;
  focusBlockId: string | null;
  onSlash: (rect: DOMRect, mode: 'replace' | 'add') => void;
  onMoveFocus: (direction: 'up' | 'down') => void;
  onBackspaceEmpty?: () => void; // Prop para remoção via teclado
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
  
  const isFocused = focusBlockId === block.id;

  const codeLanguages = [
    { label: 'SQL', value: 'sql' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
    { label: 'Python', value: 'python' },
  ];

  const getNumberedListIndex = () => {
    let displayIndex = 1;
    for (let i = index - 1; i >= 0; i--) {
      if (allBlocks[i].type === 'numbered_list') {
        displayIndex++;
      } else {
        break;
      }
    }
    return displayIndex;
  };

  // Agrupamos as propriedades comuns para evitar repetição
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
      return (
        <TextBlock 
          {...textProps}
          initialHtml={block.data.text} 
          blockType={block.type}
          placeholder="Digite '/' para comandos..."
          onEnter={() => addBlock('text', index, false)} 
        />
      );

    case 'bullet_list':
      return (
        <div className="flex items-start gap-2 mb-1">
          <span className="text-gray-400 mt-1.5 font-bold select-none ml-2">•</span>
          <TextBlock 
            {...textProps}
            initialHtml={block.data.text} 
            blockType={block.type}
            placeholder="Lista..."
            onEnter={(type) => addBlock(type || 'bullet_list', index, false)}
          />
        </div>
      );

    case 'numbered_list':
      return (
        <div className="flex items-start gap-2 mb-1">
          <span className="text-gray-400 mt-1 min-w-[1.2rem] text-right font-medium select-none text-sm">
            {getNumberedListIndex()}.
          </span>
          <TextBlock 
            {...textProps}
            initialHtml={block.data.text} 
            blockType={block.type}
            placeholder="Lista numerada..."
            onEnter={(type) => addBlock(type || 'numbered_list', index, false)}
          />
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
          placeholder="Título"
          className={`font-black text-gray-900 dark:text-white ${
            block.type === 'h1' ? 'text-3xl tracking-tight' : 
            block.type === 'h2' ? 'text-2xl' : 'text-xl'
          }`}
          onEnter={() => addBlock('text', index, false)}
        />
      );

    case 'code':
  return (
    <CodeBlock 
      data={block.data} 
      onUpdate={(newData) => updateBlock(block.id, newData)} 
    />
  );

    case 'table':
      return (
        <TableBlock
          data={block.data} // Aqui block.data contém { rows: [][] }
          onUpdate={(newData) => updateBlock(block.id, newData)}
        />
      );

    case 'page' as any: 
      return (
        <PageBlock 
          title={block.data.title} 
          onClick={() => navigate(`/comunidade/editor/${block.data.pageId}`)} 
        />
      );

    case 'image':
    case 'video':
      return (
        <div className="my-2 group/media relative">
          {block.data.url ? (
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black relative group">
              {block.type === 'image' ? (
                <img src={`http://localhost:3000${block.data.url}`} className="w-full h-auto max-h-150 object-contain" alt="Content" />
              ) : (
                <video src={`http://localhost:3000${block.data.url}`} controls className="w-full max-h-150" />
              )}
              <button 
                onClick={() => updateBlock(block.id, { url: "" })} 
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-orange-500 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
              <ImageIcon size={32} className="text-gray-300 mb-2"/>
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