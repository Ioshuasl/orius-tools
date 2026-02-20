import { useRef, useEffect } from 'react';
import type { BlockType } from '../../types';

interface TextBlockProps {
  initialHtml: string;
  onUpdate: (html: string) => void;
  onUpdateType?: (newType: BlockType) => void;
  onEnter?: (type?: BlockType) => void;
  onSlash?: (rect: DOMRect) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TextBlock({
  initialHtml,
  onUpdate,
  onUpdateType,
  onEnter,
  onSlash,
  className,
  placeholder,
  autoFocus
}: TextBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false); // Trava para o HTML inicial

  // 1. Sincroniza o HTML apenas UMA VEZ na montagem
  useEffect(() => {
    if (contentRef.current && !isInitialized.current) {
      contentRef.current.innerHTML = initialHtml;
      isInitialized.current = true;
    }
  }, []); // Array vazio garante que só rode no nascimento do componente

  // 2. Gerencia o foco e cursor sem resetar o HTML
  useEffect(() => {
    if (autoFocus && contentRef.current) {
      const element = contentRef.current;
      // Só foca se já não estiver focado para não interromper a seleção
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isList = className?.includes('list-');
    const isEmpty = contentRef.current?.innerText.trim() === "";

    if (e.key === 'Enter') {
      if (contentRef.current) {
        onUpdate(contentRef.current.innerHTML);
      }

      if (e.shiftKey) {
        if (isList) {
          e.preventDefault();
          onEnter?.('text');
          return;
        }
        return;
      }

      if (!e.shiftKey) {
        if (isList && isEmpty) {
          e.preventDefault();
          onUpdateType?.('text');
          return;
        }
        e.preventDefault();
        onEnter?.();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = contentRef.current?.innerText || "";

    // Se o usuário apertar espaço ou ESC, podemos sugerir fechar o menu (opcional)
    if (e.key === ' ') {
      onSlash?.(null as any); // Fecha o menu se houver espaço
      return;
    }

    if (e.key === '/') {
      const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";
      const isAtStart = range.startOffset === 1;
      const hasSpaceBefore = textBefore.endsWith(' /');

      if (isAtStart || hasSpaceBefore) {
        onSlash?.(range.getBoundingClientRect());
      }
    }
  };

  const handleBlur = () => {
    if (contentRef.current) {
      onUpdate(contentRef.current.innerHTML);
    }
  };

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
      data-placeholder={placeholder}
      className={`
        w-full bg-transparent border-none outline-none 
        text-gray-700 dark:text-gray-300 leading-relaxed py-1 
        focus:ring-0 min-h-[1.5em] relative
        empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 
        dark:empty:before:text-gray-700 empty:before:pointer-events-none
        ${className?.includes('list-disc') ? 'list-disc ml-6' : ''}
        ${className?.includes('list-decimal') ? 'list-decimal ml-6' : ''}
        ${className}
      `}
    // REMOVIDO: dangerouslySetInnerHTML={...}
    // O conteúdo agora é injetado via ref no primeiro useEffect
    />
  );
}