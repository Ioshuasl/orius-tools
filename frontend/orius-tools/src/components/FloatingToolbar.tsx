import { useState, useEffect, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  Code, Link, Palette, Highlighter, 
  ChevronDown, Sigma 
} from 'lucide-react';

interface FloatingToolbarProps {
  position: { top: number; left: number } | null;
  isVisible: boolean;
}

export function FloatingToolbar({ position, isVisible }: FloatingToolbarProps) {
  // Estado consolidado das formatações ativas
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    latex: false
  });

  // Função core de detecção de contexto do DOM
  const updateActiveStates = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;

    // Normaliza para o elemento pai caso o container seja apenas um nó de texto
    if (container.nodeType === 3) {
      container = container.parentNode!;
    }
    
    const element = container as HTMLElement;

    setActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      // Detecção manual via árvore do DOM para nossas tags customizadas
      code: !!element.closest('code'),
      latex: !!element.closest('span.katex-inline') || selection.toString().includes('$$')
    });
  }, []);

  // Efeito de Observação Ativa: Atualiza os ícones em tempo real sem fechar a barra
  useEffect(() => {
    if (isVisible) {
      updateActiveStates();
      
      const handleLiveUpdates = () => {
        // O requestAnimationFrame sincroniza a verificação com o próximo frame do browser
        window.requestAnimationFrame(updateActiveStates);
      };

      // Escuta mudanças de seleção, digitação e cliques enquanto a barra está na tela
      document.addEventListener('selectionchange', handleLiveUpdates);
      document.addEventListener('keyup', handleLiveUpdates);
      document.addEventListener('mousedown', handleLiveUpdates);
      document.addEventListener('mouseup', handleLiveUpdates);

      return () => {
        document.removeEventListener('selectionchange', handleLiveUpdates);
        document.removeEventListener('keyup', handleLiveUpdates);
        document.removeEventListener('mousedown', handleLiveUpdates);
        document.removeEventListener('mouseup', handleLiveUpdates);
      };
    }
  }, [isVisible, updateActiveStates]);

  const triggerEditorUpdate = () => {
    const activeElement = document.activeElement;
    if (activeElement) {
      // Força o salvamento automático no TextBlock/EditorComunidade
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    triggerEditorUpdate();
    updateActiveStates();
  };

  const handleToggle = (tagName: string, className: string, isLatex = false) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) container = container.parentNode!;
    
    const element = container as HTMLElement;
    const existingTag = element.closest(tagName);

    if (existingTag) {
      const text = existingTag.textContent || "";
      const cleanText = isLatex ? text.replace(/\$\$/g, '') : text;
      const textNode = document.createTextNode(cleanText);
      existingTag.parentNode?.replaceChild(textNode, existingTag);
    } else {
      if (isLatex) {
        const text = range.toString();
        document.execCommand('insertText', false, `$$${text || 'x^2'}$$`);
      } else if (!range.collapsed) {
        const newTag = document.createElement(tagName);
        newTag.className = className;
        newTag.appendChild(range.extractContents());
        range.insertNode(newTag);
      }
    }
    
    triggerEditorUpdate();
    window.requestAnimationFrame(updateActiveStates);
  };

  if (!isVisible || !position) return null;

  const textColors = [
    { name: 'Padrão', color: 'inherit' },
    { name: 'Cinza', color: '#9B9A97' },
    { name: 'Laranja', color: '#D9730D' },
    { name: 'Verde', color: '#0F7B6C' },
    { name: 'Azul', color: '#0B6E99' },
    { name: 'Vermelho', color: '#E03E3E' },
  ];

  const bgColors = [
    { name: 'Padrão', color: 'transparent' },
    { name: 'Cinza', color: 'rgba(135, 131, 120, 0.15)' },
    { name: 'Amarelo', color: 'rgba(223, 171, 1, 0.15)' },
    { name: 'Verde', color: 'rgba(15, 123, 108, 0.15)' },
    { name: 'Azul', color: 'rgba(11, 110, 153, 0.15)' },
  ];

  return (
    <div 
      className="fixed z-[1000] flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-1 animate-in fade-in zoom-in duration-100 ring-1 ring-black/5"
      style={{ 
        top: position.top - 50, 
        left: position.left, 
        transform: 'translateX(-50%)' 
      }}
    >
      <div className="flex items-center border-r border-gray-100 dark:border-gray-700 px-1 mr-1 gap-0.5">
        <ToolbarButton onClick={() => applyFormat('bold')} active={activeStates.bold} icon={<Bold size={16} />} title="Negrito" />
        <ToolbarButton onClick={() => applyFormat('italic')} active={activeStates.italic} icon={<Italic size={16} />} title="Itálico" />
        <ToolbarButton onClick={() => applyFormat('underline')} active={activeStates.underline} icon={<Underline size={16} />} title="Sublinhado" />
        <ToolbarButton onClick={() => applyFormat('strikeThrough')} active={activeStates.strike} icon={<Strikethrough size={16} />} title="Riscado" />
      </div>

      <div className="flex items-center border-r border-gray-100 dark:border-gray-700 px-1 mr-1 gap-0.5">
        <ToolbarButton 
          onClick={() => handleToggle('code', "bg-gray-100 dark:bg-gray-800 text-[#E25555] px-1.5 py-0.5 rounded font-mono text-[0.9em]")} 
          active={activeStates.code}
          icon={<Code size={16} />} 
          title="Código Inline" 
        />
        <ToolbarButton 
          onClick={() => handleToggle('span.katex-inline', "", true)} 
          active={activeStates.latex}
          icon={<Sigma size={16} className={activeStates.latex ? 'text-orange-500' : ''} />} 
          title="Equação LaTeX" 
        />
        <ToolbarButton 
          onClick={() => {
            const url = prompt("URL:");
            if (url) applyFormat('createLink', url);
          }} 
          icon={<Link size={16} />} 
          title="Link" 
        />
      </div>

      <div className="flex items-center px-1 gap-1">
        <div className="group relative">
          <ToolbarButton icon={<div className="flex items-center gap-0.5"><Palette size={16} /><ChevronDown size={10} /></div>} title="Cor do Texto" />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:grid grid-cols-3 gap-1.5 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-max">
            {textColors.map(c => (
              <button 
                key={c.name}
                onMouseDown={(e) => { e.preventDefault(); applyFormat('foreColor', c.color); }}
                className="w-6 h-6 rounded-md border border-gray-100 dark:border-gray-600 hover:scale-110 transition-transform flex items-center justify-center text-[10px] font-bold"
                style={{ color: c.color }}
              > A </button>
            ))}
          </div>
        </div>

        <div className="group relative">
          <ToolbarButton icon={<div className="flex items-center gap-0.5"><Highlighter size={16} /><ChevronDown size={10} /></div>} title="Destaque" />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:grid grid-cols-3 gap-1.5 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 w-max">
            {bgColors.map(c => (
              <button 
                key={c.name}
                onMouseDown={(e) => { e.preventDefault(); applyFormat('hiliteColor', c.color); }}
                className="w-7 h-6 rounded-md border border-gray-100 dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, icon, title, active }: { onClick?: () => void, icon: React.ReactNode, title: string, active?: boolean }) {
  return (
    <button 
      onMouseDown={(e) => {
        e.preventDefault(); 
        onClick?.();
      }}
      title={title}
      className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
        active 
          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}
    >
      {icon}
    </button>
  );
}