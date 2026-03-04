import { useMemo, useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    ConnectionMode,
    BackgroundVariant // Importação necessária para o erro TS 2322
} from "@xyflow/react";

import { MindMapNode } from "./MindMapNode";
import { MindMapSearch } from "./MindMapSearch";

import "@xyflow/react/dist/style.css";
import { useMindMapLogic } from "../../hooks/useMindMapLogic";

const nodeTypes = { mindmap: MindMapNode };

interface MindMapInnerProps {
    initialNodes: any[];
    initialEdges: any[];
    onSave: (nodes: any[], edges: any[]) => void;
}

export function MindMapInner({ initialNodes, initialEdges, onSave }: MindMapInnerProps) {
    // O erro TS 2554 sumirá assim que o useMindMapLogic for atualizado (veja abaixo)
    const {
        nodes,
        edges,
        searchQuery,
        setSearchQuery,
        dropTargetId,
        onNodesChange,
        onEdgesChange,
        onNodeDrag,
        onNodeDragStop,
        updateNodeLabel,
        toggleCollapse,
        deleteNode,
        addChildNode,
        addSiblingNode
    } = useMindMapLogic(initialNodes, initialEdges, onSave);

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;

        const selectedNode = nodes.find((n) => n.selected);
        if (!selectedNode) return;

        if (event.key === "Tab") {
            event.preventDefault();
            addChildNode(selectedNode.id);
        }
        if (event.key === "Enter") {
            event.preventDefault();
            addSiblingNode(selectedNode.id);
        }
        if (event.key === "Delete" || event.key === "Backspace") {
            deleteNode(selectedNode.id);
        }
    }, [nodes, addChildNode, addSiblingNode, deleteNode]);

    const nodesWithCallbacks = useMemo(() => {
        return nodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                matchingSearch: !!(searchQuery && node.data.label.toLowerCase().includes(searchQuery.toLowerCase())),
                isDropTarget: node.id === dropTargetId,
                onChange: updateNodeLabel,
                onToggle: toggleCollapse,
                onAddChild: addChildNode,
                onAddSibling: addSiblingNode,
                onDelete: deleteNode,
            },
        }));
    }, [nodes, searchQuery, dropTargetId, updateNodeLabel, toggleCollapse, addChildNode, addSiblingNode, deleteNode]);

    const fitViewOptions = {
        padding: 0.2, // Espaçamento entre as bordas e os nós
        minZoom: 0.5, // Não deixa ficar "longe demais" ao carregar
        maxZoom: 1.2, // Não deixa dar um zoom muito forte em mapas pequenos
        duration: 800, // Se quiser uma animação suave ao entrar
    };

    return (
        <div
            className="w-full h-full outline-none relative bg-white dark:bg-gray-950"
            onKeyDown={onKeyDown}
            tabIndex={0}
        >
            <MindMapSearch value={searchQuery} onChange={setSearchQuery} />

            <ReactFlow
                nodes={nodesWithCallbacks}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={fitViewOptions}
                preventScrolling={true}
            >
                {/* Correção TS 2322: Usando BackgroundVariant.Dots */}
                <Background color="#888" gap={20} variant={BackgroundVariant.Dots} size={1} />
                <Controls showInteractive={false} className="dark:bg-gray-800 dark:border-gray-700" />
            </ReactFlow>
        </div>
    );
}