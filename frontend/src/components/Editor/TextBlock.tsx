import { useRef, useEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { BlockType } from '../../types';

interface TextBlockProps {
  initialHtml: string;
  blockType: BlockType;
  onUpdate: (html: string) => void;
  onUpdateType?: (newType: BlockType) => void;
  onEnter?: (type?: BlockType) => void;
  onSlash?: (rect: DOMRect) => void;
  onMoveFocus?: (direction: 'up' | 'down') => void;
  onBackspaceEmpty?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TextBlock({
  initialHtml,
  blockType,
  onUpdate,
  onUpdateType,
  onEnter,
  onSlash,
  onMoveFocus,
  onBackspaceEmpty,
  className,
  placeholder,
  autoFocus
}: TextBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const lastLocalHtml = useRef(initialHtml);

  useEffect(() => {
    if (contentRef.current && !isInitialized.current) {
      contentRef.current.innerHTML = initialHtml;
      isInitialized.current = true;
    }
  }, [initialHtml]);

  useEffect(() => {
    // Se o HTML que veio de fora (initialHtml) for diferente do que temos localmente,
    // significa que houve um Undo ou Redo global.
    if (contentRef.current && initialHtml !== lastLocalHtml.current) {
      contentRef.current.innerHTML = initialHtml;
      lastLocalHtml.current = initialHtml;

      // Opcional: Colocar o cursor no fim se o bloco recebeu foco via Undo
      if (autoFocus) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [initialHtml, autoFocus]);

  useEffect(() => {
    if (autoFocus && contentRef.current) {
      const element = contentRef.current;
      if (document.activeElement !== element) {
        element.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [autoFocus]);

  // Renderização de LaTeX
  const processLatex = useCallback(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;
    const content = container.innerHTML;
    const latexRegex = /\$\$(.*?)\$\$/g;

    if (latexRegex.test(content)) {
      const newHtml = content.replace(latexRegex, (_, tex) => {
        try {
          const rendered = katex.renderToString(tex, { throwOnError: false, displayMode: false });
          return `<span class="katex-inline" contenteditable="false" data-tex="${tex}">${rendered}</span>&nbsp;`;
        } catch (e) {
          return `$$${tex}$$`;
        }
      });
      container.innerHTML = newHtml;

      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(container);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handleInput = () => {
    if (contentRef.current) {
      const newHtml = contentRef.current.innerHTML;
      lastLocalHtml.current = newHtml; // Atualiza a ref local para evitar loops
      processLatex();
      onUpdate(newHtml);
    }
  };

  // --- Lógica de Toggle para Tags Customizadas (Code/Latex) ---
  // Dentro do TextBlock.tsx

  const toggleCustomStyle = (tagName: string, className: string, isLatex = false) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;

    // Normaliza o container para elemento
    if (container.nodeType === 3) container = container.parentNode!;

    const existingTag = (container as HTMLElement).closest(tagName);

    if (existingTag) {
      // TOGGLE OFF: Remove a tag e coloca o texto de volta
      const text = existingTag.textContent || "";
      const textNode = document.createTextNode(isLatex ? text.replace(/\$\$/g, '') : text);
      existingTag.parentNode?.replaceChild(textNode, existingTag);
    } else {
      // TOGGLE ON
      if (isLatex) {
        const text = range.toString();
        const latexText = `$$${text || 'x^2'}$$`;
        document.execCommand('insertText', false, latexText);
      } else {
        if (!range.collapsed) {
          const span = document.createElement(tagName);
          span.className = className;
          span.appendChild(range.extractContents());
          range.insertNode(span);
          selection.removeAllRanges(); // Limpa a seleção para evitar bugs de aninhamento
        }
      }
    }
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const selection = window.getSelection();
    const isEmpty = contentRef.current?.innerText.trim() === "";

    // 1. BLOQUEIO DE UNDO/REDO NATIVO (Estilo Notion)
    // Impedimos o comportamento padrão para que o listener global do EditorComunidade
    // gerencie o histórico de estados do React em vez do histórico de texto do browser.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      return; // O evento sobe para o window e o undo() global é disparado
    }

    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      return; // O evento sobe para o window e o redo() global é disparado
    }

    // 2. ATALHOS DE FORMATAÇÃO (Toggle)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false);
          handleInput();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false);
          handleInput();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false);
          handleInput();
          break;
        case 's':
          if (e.shiftKey) {
            e.preventDefault();
            document.execCommand('strikeThrough', false);
            handleInput();
          }
          break;
        case 'e': // Código Inline
          e.preventDefault();
          toggleCustomStyle('code', "bg-gray-100 dark:bg-gray-800 text-[#E25555] px-1.5 py-0.5 rounded font-mono text-[0.9em]");
          break;
        case 'm': // LaTeX Toggle (Ctrl + M)
          e.preventDefault();
          toggleCustomStyle('span.katex-inline', "", true);
          break;
        case 'k': // Inserir Link
          e.preventDefault();
          const url = prompt("URL:");
          if (url) {
            document.execCommand('createLink', false, url);
            handleInput();
          }
          break;
      }
    }

    // 3. LÓGICA DE BACKSPACE (Remoção e conversão de tipo)
    if (e.key === 'Backspace') {
      if (blockType !== 'text' && isEmpty) {
        e.preventDefault();
        onUpdateType?.('text'); // Converte bloco especial de volta para texto se estiver vazio
        return;
      }
      if (blockType === 'text' && isEmpty) {
        e.preventDefault();
        onBackspaceEmpty?.(); // Remove o bloco e foca no anterior
        return;
      }
    }

    // 4. LÓGICA DE ENTER (Criação de novos blocos)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (contentRef.current) onUpdate(contentRef.current.innerHTML);
      // Mantém o tipo se for lista, caso contrário cria um novo bloco de texto
      onEnter?.(blockType.includes('list') ? blockType : 'text');
    }

    // 5. NAVEGAÇÃO POR SETAS (Mudança de foco entre blocos)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Se estiver no início do bloco e apertar para cima, sobe o foco
        if (e.key === 'ArrowUp' && range.startOffset === 0) {
          onMoveFocus?.('up');
        }
        // Se estiver no fim do bloco e apertar para baixo, desce o foco
        else if (e.key === 'ArrowDown' && range.startOffset === contentRef.current?.innerText.length) {
          onMoveFocus?.('down');
        }
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === '/' || (e.key === 'q' && e.altKey)) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect.top !== 0) onSlash?.(rect);
      }
    }
  };

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => contentRef.current && onUpdate(contentRef.current.innerHTML)}
      data-placeholder={placeholder}
      className={`
        w-full bg-transparent border-none outline-none 
        text-gray-700 dark:text-gray-300 leading-relaxed py-1 
        focus:ring-0 min-h-[1.5em] relative
        empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 
        dark:empty:before:text-gray-700 empty:before:pointer-events-none
        [&_.katex-inline]:mx-1 [&_.katex-inline]:text-orange-600 dark:[&_.katex-inline]:text-orange-400
        [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:text-[#E25555] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono
        [&_a]:text-orange-500 [&_a]:underline
        ${className || ''}
      `}
    />
  );
}