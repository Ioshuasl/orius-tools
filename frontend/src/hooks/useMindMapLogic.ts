import { useCallback, useEffect, useState, useRef } from "react";
import { 
  useNodesState, 
  useEdgesState, 
  useReactFlow, 
  type Edge, 
  type OnNodeDrag,
  type OnNodesChange,
  type OnEdgesChange
} from "@xyflow/react";
import { 
  layoutTree, 
  BRANCH_COLORS, 
  recursiveUpdateColor 
} from "./MindMapUtils";
import type { MindMapNodeType } from "../components/Editor/MindMapNode";

/**
 * Hook de lógica para o Bloco de Mapa Mental.
 * Corrigido para evitar loops infinitos de atualização com o Editor.
 */
export function useMindMapLogic(
  initialNodes: MindMapNodeType[], 
  initialEdges: Edge[], 
  onSave: (nodes: MindMapNodeType[], edges: Edge[]) => void
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const { getIntersectingNodes } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // REF PARA QUEBRAR O LOOP: Armazena a versão stringificada dos últimos dados enviados
  const lastSavedVersionRef = useRef<string>(JSON.stringify({ nodes: initialNodes, edges: initialEdges }));

  /**
   * Sincronização Segura com o Editor:
   * Compara o estado atual com a última versão salva para evitar re-renders infinitos.
   */
  useEffect(() => {
    const currentDataString = JSON.stringify({ nodes, edges });

    if (currentDataString !== lastSavedVersionRef.current) {
      lastSavedVersionRef.current = currentDataString;
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  /* --- Funções de Edição (CRUD) --- */

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)));
  }, [setNodes]);

  const toggleCollapse = useCallback((id: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n)));
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    if (id === 'root') return;
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  /* --- Criação de Nós --- */

  const addChildNode = useCallback((parentId: string) => {
    const id = crypto.randomUUID();
    const parentNode = nodes.find(n => n.id === parentId);
    let branchColor = parentNode?.data?.color;

    if (parentId === 'root') {
      const rootChildrenCount = edges.filter(e => e.source === 'root').length;
      branchColor = BRANCH_COLORS[rootChildrenCount % BRANCH_COLORS.length];
    }

    const newNode: MindMapNodeType = {
      id,
      type: "mindmap",
      data: { 
        label: "Novo Tópico", 
        color: branchColor, 
        matchingSearch: false,
        isDropTarget: false 
      } as any,
      position: { x: 0, y: 0 },
    };

    const newEdge: Edge = { 
      id: `e-${parentId}-${id}`, 
      source: parentId, 
      target: id, 
      style: { stroke: branchColor, strokeWidth: 3 } 
    };

    const laidOutNodes = layoutTree([...nodes, newNode], [...edges, newEdge]);
    setNodes(laidOutNodes);
    setEdges((eds) => [...eds, newEdge]);
  }, [nodes, edges, setNodes, setEdges]);

  const addSiblingNode = useCallback((nodeId: string) => {
    const parentEdge = edges.find(e => e.target === nodeId);
    if (parentEdge) {
      addChildNode(parentEdge.source);
    } else if (nodeId === 'root') {
      addChildNode('root');
    }
  }, [edges, addChildNode]);

  /* --- Lógica de Arrastar e Reparentar --- */
  
  const onNodeDrag: OnNodeDrag = useCallback((_, node) => {
    const intersections = getIntersectingNodes(node);
    const target = intersections.find((n) => n.id !== node.id);
    setDropTargetId(target ? target.id : null);
  }, [getIntersectingNodes]);

  const onNodeDragStop: OnNodeDrag = useCallback((_, node) => {
    if (node.id === 'root') return;

    const intersections = getIntersectingNodes(node);
    const targetNode = intersections.find((n) => n.id !== node.id) as MindMapNodeType | undefined;

    if (targetNode) {
      const newEdges = edges.filter((e) => e.target !== node.id);
      let branchColor = targetNode.data.color;

      if (targetNode.id === 'root') {
        const rootChildrenCount = newEdges.filter(e => e.source === 'root').length;
        branchColor = BRANCH_COLORS[rootChildrenCount % BRANCH_COLORS.length];
      }

      const newEdge: Edge = {
        id: `e-${targetNode.id}-${node.id}`,
        source: targetNode.id,
        target: node.id,
        style: { stroke: branchColor, strokeWidth: 3 }
      };

      const updatedNodes = recursiveUpdateColor(nodes, [...newEdges, newEdge], node.id, branchColor || '#333');
      const laidOutNodes = layoutTree(updatedNodes, [...newEdges, newEdge]);
      
      setEdges([...newEdges, newEdge]);
      setNodes(laidOutNodes);
    } else {
      // Reposiciona o nó no layout caso ele tenha sido arrastado para o vazio
      setNodes(layoutTree(nodes, edges));
    }
    
    setDropTargetId(null);
  }, [edges, nodes, getIntersectingNodes, setEdges, setNodes]);

  return {
    nodes,
    edges,
    searchQuery,
    setSearchQuery,
    dropTargetId,
    onNodesChange: onNodesChange as OnNodesChange<MindMapNodeType>,
    onEdgesChange: onEdgesChange as OnEdgesChange,
    onNodeDrag,
    onNodeDragStop,
    updateNodeLabel,
    toggleCollapse,
    deleteNode,
    addChildNode,
    addSiblingNode
  };
}