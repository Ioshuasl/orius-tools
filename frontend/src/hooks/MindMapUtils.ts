import dagre from "dagre";
import { Position, type Edge } from "@xyflow/react";
import type { MindMapNodeType } from "../components/Editor/MindMapNode";


/* =========================
   Constantes Globais
========================= */
export const STORAGE_KEY = "mindmap-tree";
export const nodeWidth = 180;
export const nodeHeight = 60;

// Paleta de cores estilo MindMeister para os ramos
export const BRANCH_COLORS = ["#9575cd", "#4fc3f7", "#81c784", "#fff176", "#ff8a65", "#f06292"];

/* =========================
   Motor de Layout (Dagre)
========================= */
/**
 * Calcula as posições dos nós em formato de árvore da esquerda para a direita.
 *
 */
export function layoutTree(nodes: MindMapNodeType[], edges: Edge[]): MindMapNodeType[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configuração LR (Left to Right) para o mapa mental
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    if (!edge.hidden) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    if (!pos) return node;

    return {
      ...node,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

/* =========================
   Utilitários de Árvore
========================= */
/**
 * Atualiza recursivamente a cor de um nó e de todos os seus descendentes.
 * Essencial para manter a consistência visual ao reparentar um ramo.
 */
export function recursiveUpdateColor(
  nodesList: MindMapNodeType[], 
  edgesList: Edge[], 
  rootId: string, 
  color: string
): MindMapNodeType[] {
  // Encontra os IDs dos filhos diretos
  const children = edgesList
    .filter(e => e.source === rootId)
    .map(e => e.target);

  // Atualiza o nó atual
  let updated = nodesList.map(n => 
    n.id === rootId ? { ...n, data: { ...n.data, color } } : n
  );

  // Aplica recursivamente aos filhos
  children.forEach(childId => {
    updated = recursiveUpdateColor(updated, edgesList, childId, color);
  });

  return updated;
}