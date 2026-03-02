import type { Block } from '../types';

/**
 * Converte marcações de Markdown Inline para HTML seguro
 */
function formatInlineMarkdown(text: string): string {
  return text
    // Escapa caracteres HTML básicos para evitar quebras
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Negrito: **texto** ou __texto__
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/__(.*?)__/g, '<b>$1</b>')
    // Itálico: *texto* ou _texto_
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/_(.*?)_/g, '<i>$1</i>')
    // Código Inline: `código`
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-[#E25555] px-1.5 py-0.5 rounded font-mono text-[0.9em]">$1</code>')
    // Tachado: ~~texto~~
    .replace(/~~(.*?)~~/g, '<strike>$1</strike>')
    // Links: [texto](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-orange-500 underline" target="_blank">$1</a>');
}

export function parseMarkdownToBlocks(text: string): Block[] {
  const cleanText = text.replace(/\r/g, '');
  const lines = cleanText.split('\n');
  const blocks: Block[] = [];
  
  let isInsideCode = false;
  let codeBuffer: string[] = [];
  let currentLanguage = 'javascript';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // --- Lógica de Bloco de Código (Não formatamos conteúdo inline aqui) ---
    if (line.startsWith('```')) {
      if (!isInsideCode) {
        isInsideCode = true;
        codeBuffer = [];
        currentLanguage = line.replace('```', '').trim() || 'javascript';
      } else {
        blocks.push({
          id: Math.random().toString(36).substring(2, 11),
          type: 'code',
          data: { code: codeBuffer.join('\n'), language: currentLanguage }
        });
        isInsideCode = false;
      }
      continue;
    }

    if (isInsideCode) {
      codeBuffer.push(line);
      continue;
    }

    if (trimmed === "") continue;

    const generateId = () => Math.random().toString(36).substring(2, 11);

    // --- Processamento de Conteúdo com Formatação Inline ---
    
    // H1, H2, H3
    if (line.startsWith('# ')) {
      blocks.push({ 
        id: generateId(), 
        type: 'h1', 
        data: { text: formatInlineMarkdown(line.replace('# ', '').trim()) } 
      });
    } else if (line.startsWith('## ')) {
      blocks.push({ 
        id: generateId(), 
        type: 'h2', 
        data: { text: formatInlineMarkdown(line.replace('## ', '').trim()) } 
      });
    } else if (line.startsWith('### ')) {
      blocks.push({ 
        id: generateId(), 
        type: 'h3', 
        data: { text: formatInlineMarkdown(line.replace('### ', '').trim()) } 
      });
    } 
    // Listas (Note o formatInlineMarkdown no conteúdo)
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ 
        id: generateId(), 
        type: 'bullet_list', 
        data: { text: formatInlineMarkdown(trimmed.replace(/^[-*]\s+/, '')) } 
      });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      blocks.push({ 
        id: generateId(), 
        type: 'numbered_list', 
        data: { text: formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, '')) } 
      });
    } 
    else {
      // Texto comum
      blocks.push({ 
        id: generateId(), 
        type: 'text', 
        data: { text: formatInlineMarkdown(trimmed) } 
      });
    }
  }

  if (isInsideCode && codeBuffer.length > 0) {
    blocks.push({
      id: Math.random().toString(36).substring(2, 11),
      type: 'code',
      data: { code: codeBuffer.join('\n'), language: currentLanguage }
    });
  }

  return blocks;
}