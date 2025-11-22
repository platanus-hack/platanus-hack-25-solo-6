"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  type Node,
  type Edge,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

import type { Consequence } from "@/services";
import ConsequenceNode from "./ConsequenceNode";
import DetailPanel from "./DetailPanel";

interface DecisionTreeProps {
  decision: string;
  consequences: Consequence[];
}

const nodeTypes: NodeTypes = {
  consequence: ConsequenceNode,
};

export default function DecisionTree({ decision, consequences }: DecisionTreeProps) {
  const [selectedConsequence, setSelectedConsequence] = useState<Consequence | null>(null);

  // Create nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalGap = 200;
    const verticalGap = 100;

    // Calculate total height needed for all consequence nodes
    const totalHeight = consequences.length * nodeHeight + (consequences.length - 1) * verticalGap;
    const startY = -totalHeight / 2 + nodeHeight / 2;

    // Root node (decision) - a la izquierda
    const rootNode: Node = {
      id: "root",
      type: "consequence",
      position: { x: 0, y: 0 },
      data: {
        label: decision,
        probabilidad: 100,
        isRoot: true,
      },
    };

    // Consequence nodes - a la derecha, distribuidos verticalmente
    const consequenceNodes: Node[] = consequences.map((consequence, index) => ({
      id: `consequence-${index}`,
      type: "consequence",
      position: {
        x: horizontalGap + nodeWidth,
        y: startY + index * (nodeHeight + verticalGap),
      },
      data: {
        label: consequence.nombre,
        probabilidad: consequence.probabilidad,
        isRoot: false,
      },
    }));

    // Edges connecting root to consequences - líneas curvas punteadas
    const consequenceEdges: Edge[] = consequences.map((_, index) => ({
      id: `edge-root-${index}`,
      source: "root",
      target: `consequence-${index}`,
      type: "default",
      animated: false,
      style: {
        stroke: "#9ca3af",
        strokeWidth: 2,
        strokeDasharray: "5 5",
      },
    }));

    return {
      nodes: [rootNode, ...consequenceNodes],
      edges: consequenceEdges,
    };
  }, [decision, consequences]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === "root") {
        setSelectedConsequence(null);
        return;
      }

      const index = parseInt(node.id.replace("consequence-", ""));
      setSelectedConsequence(consequences[index] || null);
    },
    [consequences]
  );

  return (
    <div className="flex h-[700px] w-full gap-0">
      {/* React Flow Canvas */}
      <div className={`transition-all ${selectedConsequence ? "w-2/3" : "w-full"}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView={false}
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 300, y: 300, zoom: 1 }}
          className="bg-white dark:bg-gray-950"
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
        >
          <Background
            color="#e2e8f0"
            gap={20}
            size={1}
            className="dark:!bg-gray-900"
          />
        </ReactFlow>
      </div>

      {/* Detail Panel */}
      {selectedConsequence && (
        <div className="w-1/3">
          <DetailPanel
            consequence={selectedConsequence}
            onClose={() => setSelectedConsequence(null)}
          />
        </div>
      )}
    </div>
  );
}
