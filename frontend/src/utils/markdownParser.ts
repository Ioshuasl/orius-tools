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

  const generateId = () => Math.random().toString(36).substring(2, 11);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // --- Lógica de Bloco de Código ---
    if (line.startsWith('```')) {
      if (!isInsideCode) {
        isInsideCode = true;
        codeBuffer = [];
        currentLanguage = line.replace('```', '').trim() || 'javascript';
      } else {
        blocks.push({
          id: generateId(),
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

    // --- Lógica de Divisor (Inspirado no Notion) ---
    // Detecta sequências comuns de Markdown para réguas horizontais
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({
        id: generateId(),
        type: 'divider',
        data: {}
      });
      continue;
    }

    if (trimmed === "") continue;

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
    // Listas
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

  // Fecha bloco de código caso o arquivo termine sem fechar as aspas
  if (isInsideCode && codeBuffer.length > 0) {
    blocks.push({
      id: generateId(),
      type: 'code',
      data: { code: codeBuffer.join('\n'), language: currentLanguage }
    });
  }

  return blocks;
}