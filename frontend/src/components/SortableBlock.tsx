// src/components/SortableBlock.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

interface SortableBlockProps {
  id: string;
  children: (props: any) => React.ReactNode; // Mudamos para render props ou passamos os listeners
}

export function SortableBlock({ id, children }: { id: string, children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  // Passamos as propriedades necessárias para o container principal
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Não colocamos os listeners aqui no container pai, 
          senão o bloco inteiro vira um "arrastável" e impede a seleção de texto.
      */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            dragHandleProps: { ...attributes, ...listeners } 
          });
        }
        return child;
      })}
    </div>
  );
}