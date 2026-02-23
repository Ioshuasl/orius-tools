import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Block } from '../../types';

interface TableOfContentsProps {
  blocks: Block[];
  onScrollToBlock: (id: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function TableOfContents({ blocks, onScrollToBlock, scrollContainerRef }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const anchorBlocks = blocks.filter(b => ['h1', 'h2', 'h3'].includes(b.type));

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let currentActive = anchorBlocks[0]?.id;

      anchorBlocks.forEach((b) => {
        const el = document.querySelector(`[data-id="${b.id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= viewportCenter) {
            currentActive = b.id;
          }
        }
      });
      setActiveId(currentActive);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [anchorBlocks, scrollContainerRef]);

  if (anchorBlocks.length === 0) return null;

  return (
    <>
      {/* Gatilho: Agora usamos 'fixed' com 'right-8' para dar respiro da borda da tela */}
      {/* O 'w-8' cria uma área de hover mais confortável */}
      <div 
        className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center group cursor-pointer py-10 w-8"
        onMouseEnter={() => setIsOpen(true)}
      >
        <div className="flex flex-col gap-2 items-end">
          {anchorBlocks.map((block) => (
            <div
              key={block.id}
              className={`h-[2px] rounded-full transition-all duration-300 shadow-sm ${
                activeId === block.id 
                  ? 'w-6 bg-orange-500' 
                  : 'w-3 bg-gray-200 dark:bg-gray-800 group-hover:bg-gray-400 dark:group-hover:bg-gray-600'
              } ${
                block.type === 'h1' ? 'h-[3px]' : block.type === 'h2' ? 'h-[2px]' : 'h-[1.5px] w-2'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Menu Flutuante (Portal) */}
      {isOpen && createPortal(
        <div 
          className="fixed right-20 top-1/2 -translate-y-1/2 z-[100] animate-in fade-in slide-in-from-right-4 duration-200"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex flex-col gap-1 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl min-w-[180px]">
            <div className="px-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Navegação</span>
            </div>
            {anchorBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => {
                  onScrollToBlock(block.id);
                  setIsOpen(false);
                }}
                className={`text-right text-[11px] transition-all hover:text-orange-500 py-1.5 px-3 whitespace-nowrap rounded-lg
                  ${activeId === block.id 
                    ? 'font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm' 
                    : 'font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                  ${block.type === 'h2' ? 'mr-2' : block.type === 'h3' ? 'mr-4' : ''}
                `}
              >
                {block.data.text?.replace(/<[^>]*>/g, '') || "Sem título"}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}