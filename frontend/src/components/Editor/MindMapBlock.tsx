import { useCallback } from 'react';
import { ReactFlowProvider } from "@xyflow/react";
import { MindMapInner } from "./MindMapInner";
import type { MindMapNodeType } from "./MindMapNode";
import type { Edge } from "@xyflow/react";

interface MindMapBlockProps {
  id: string;
  data: {
    nodes?: MindMapNodeType[];
    edges?: Edge[];
  };
  updateBlock: (id: string, newData: any) => void;
}

/**
 * Bloco de Mapa Mental para o Editor NÚCLEO GÊNESIS.
 * Utiliza ReactFlowProvider para isolar o estado de cada mapa na página.
 */
export function MindMapBlock({ id, data, updateBlock }: MindMapBlockProps) {
  
  /**
   * CORREÇÃO: useCallback evita que esta função seja recriada em todo render do Editor.
   * Isso interrompe o loop infinito de atualizações entre o Bloco e o useMindMapLogic.
   */
  const handleSave = useCallback((nodes: MindMapNodeType[], edges: Edge[]) => {
    updateBlock(id, { nodes, edges });
  }, [id, updateBlock]);

  // Define os dados iniciais caso o bloco acabe de ser criado
  const initialNodes = data.nodes || [
    { 
      id: "root", 
      type: "mindmap", 
      data: { label: "Tópico Central", isRoot: true, color: "#333" }, 
      position: { x: 0, y: 0 } 
    }
  ];
  
  const initialEdges = data.edges || [];

  return (
    <div className="w-full h-[600px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950 my-6 shadow-sm">
      {/* O ReactFlowProvider é essencial para que os hooks do React Flow funcionem isoladamente */}
      <ReactFlowProvider>
         <MindMapInner 
            initialNodes={initialNodes} 
            initialEdges={initialEdges} 
            onSave={handleSave} 
         />
      </ReactFlowProvider>
    </div>
  );
}