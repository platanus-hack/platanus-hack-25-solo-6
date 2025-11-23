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
import { felipeService } from "@/services";
import { useSession } from "next-auth/react";
import ConsequenceNode from "./ConsequenceNode";
import DetailPanel from "./DetailPanel";

interface DecisionTreeProps {
  decision: string;
  consequences: Consequence[];
  decisionId?: string;
}

const nodeTypes: NodeTypes = {
  consequence: ConsequenceNode,
};

export default function DecisionTree({
  decision,
  consequences,
  decisionId,
}: DecisionTreeProps) {
  const { data: session } = useSession();
  const [selectedConsequence, setSelectedConsequence] = useState<Consequence | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Map of nodeId -> array of child consequences
  const [expandedNodes, setExpandedNodes] = useState<Map<string, Consequence[]>>(() => {
    // Initialize from Firestore data
    const initialMap = new Map<string, Consequence[]>();

    function buildExpandedNodesFromConsequences(
      consequencesList: Consequence[],
      parentId: string
    ) {
      consequencesList.forEach((consequence, index) => {
        const nodeId = parentId === "root"
          ? `consequence-${index}`
          : `${parentId}-${index}`;

        if (consequence.expandedConsequences && consequence.expandedConsequences.length > 0) {
          console.log(`📂 Restoring expanded node: ${nodeId} with ${consequence.expandedConsequences.length} children`);
          initialMap.set(nodeId, consequence.expandedConsequences);
          // Recursively build for nested expansions
          buildExpandedNodesFromConsequences(consequence.expandedConsequences, nodeId);
        }
      });
    }

    buildExpandedNodesFromConsequences(consequences, "root");
    console.log(`🔄 Restored ${initialMap.size} expanded nodes from Firestore`);

    return initialMap;
  });
  // Set of nodeIds currently being expanded
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Create nodes and edges with hierarchical support
  const { nodes, edges } = useMemo(() => {
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalGap = 350;
    const verticalGap = 100;

    const allNodes: Node[] = [];
    const allEdges: Edge[] = [];

    // Helper function to recursively build tree
    function buildTree(
      parentId: string,
      children: Consequence[],
      level: number,
      startY: number
    ): number {
      if (children.length === 0) return startY;

      const totalHeight = children.length * nodeHeight + (children.length - 1) * verticalGap;
      let currentY = startY - totalHeight / 2 + nodeHeight / 2;

      children.forEach((consequence, index) => {
        const nodeId = parentId === "root"
          ? `consequence-${index}`
          : `${parentId}-${index}`;

        const isExpanded = expandedNodes.has(nodeId);
        const isLoading = loadingNodes.has(nodeId);

        console.log(`📍 Creating node: ${nodeId} at level ${level}, parent: ${parentId}`);

        // Create node
        allNodes.push({
          id: nodeId,
          type: "consequence",
          position: {
            x: level * horizontalGap,
            y: currentY,
          },
          data: {
            label: consequence.nombre,
            probabilidad: consequence.probabilidad,
            isRoot: false,
            hasPolymarketData: consequence.relatedMarkets && consequence.relatedMarkets.length > 0,
            isExpanded,
            isLoading,
          },
        });

        // Create edge from parent to this node
        const edge = {
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "default",
          animated: false,
          style: {
            stroke: "#9ca3af",
            strokeWidth: 2,
            strokeDasharray: "5 5",
          },
        };
        console.log(`🔗 Creating edge: ${edge.source} → ${edge.target}`);
        allEdges.push(edge);

        // If this node is expanded, recursively build its children
        const childConsequences = expandedNodes.get(nodeId);
        if (childConsequences && childConsequences.length > 0) {
          buildTree(nodeId, childConsequences, level + 1, currentY);
        }

        currentY += nodeHeight + verticalGap;
      });

      return currentY;
    }

    // Root node (decision)
    const rootNode: Node = {
      id: "root",
      type: "consequence",
      position: { x: 0, y: 0 },
      data: {
        label: "Decisión",
        probabilidad: 100,
        isRoot: true,
      },
    };
    allNodes.push(rootNode);

    // Build tree starting from root consequences
    buildTree("root", consequences, 1, 0);

    console.log(`🌲 Tree rebuilt: ${allNodes.length} nodes, ${allEdges.length} edges`);
    console.log(`📊 Expanded nodes:`, Array.from(expandedNodes.keys()));
    console.log(`🔗 All edges:`, allEdges.map(e => `${e.source}→${e.target}`).join(", "));
    console.log(`📍 All node IDs:`, allNodes.map(n => n.id).join(", "));

    // Verify all edges have valid source and target
    const nodeIds = new Set(allNodes.map(n => n.id));
    const invalidEdges = allEdges.filter(e => !nodeIds.has(e.source) || !nodeIds.has(e.target));
    if (invalidEdges.length > 0) {
      console.error(`❌ Invalid edges found:`, invalidEdges);
    }

    return {
      nodes: allNodes,
      edges: allEdges,
    };
  }, [consequences, expandedNodes, loadingNodes]);

  // Find consequence by nodeId recursively
  // This looks in BOTH the Map (in-memory) AND expandedConsequences (from Firestore)
  const findConsequenceByNodeId = useCallback(
    (nodeId: string): Consequence | null => {
      if (nodeId === "root") return null;

      // Check root level consequences
      const parts = nodeId.split("-");
      if (parts.length === 2) {
        // Format: "consequence-X"
        const index = parseInt(parts[1]);
        return consequences[index] || null;
      }

      // Navigate through consequences recursively
      let current: Consequence[] = consequences;

      for (let i = 1; i < parts.length; i++) {
        const index = parseInt(parts[i]);
        const currentNodeId = parts.slice(0, i + 1).join("-");

        if (i === 1) {
          // First level
          const cons = current[index];
          if (!cons) return null;
          if (currentNodeId === nodeId) return cons;

          // Try to get children from Map first, then from Firestore data
          const childrenFromMap = expandedNodes.get(currentNodeId);
          const childrenFromFirestore = cons.expandedConsequences;
          const children = childrenFromMap || childrenFromFirestore;

          if (!children) return null;
          current = children;
        } else {
          // Deeper levels
          const cons = current[index];
          if (!cons) return null;
          if (currentNodeId === nodeId) return cons;

          // Try to get children from Map first, then from Firestore data
          const childrenFromMap = expandedNodes.get(currentNodeId);
          const childrenFromFirestore = cons.expandedConsequences;
          const children = childrenFromMap || childrenFromFirestore;

          if (!children) return null;
          current = children;
        }
      }

      return null;
    },
    [consequences, expandedNodes]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === "root") {
        setSelectedConsequence(null);
        setSelectedNodeId(null);
        return;
      }

      const consequence = findConsequenceByNodeId(node.id);
      setSelectedConsequence(consequence);
      setSelectedNodeId(node.id);

      // ALWAYS collapse siblings and restore/show current node's children
      if (consequence?.expandedConsequences && consequence.expandedConsequences.length > 0) {
        const parts = node.id.split("-");
        const parentId = parts.slice(0, -1).join("-") || "root";

        setExpandedNodes((prev) => {
          const newMap = new Map(prev);
          const isAlreadyInMap = newMap.has(node.id);

          // First, remove all expanded nodes that share the same parent (siblings)
          const keysToRemove: string[] = [];
          newMap.forEach((value, key) => {
            const keyParts = key.split("-");
            const keyParent = keyParts.slice(0, -1).join("-") || "root";

            // If this is a sibling (same parent, different node)
            if (keyParent === parentId && key !== node.id) {
              console.log(`🗑️  Collapsing sibling: ${key}`);
              keysToRemove.push(key);
              // Also remove any descendants
              newMap.forEach((_, descendantKey) => {
                if (descendantKey.startsWith(key + "-")) {
                  console.log(`🗑️  Removing descendant: ${descendantKey}`);
                  keysToRemove.push(descendantKey);
                }
              });
            }
          });

          keysToRemove.forEach(key => newMap.delete(key));

          // Then add/restore the current node's expansion
          if (!isAlreadyInMap) {
            console.log(`🔄 Restoring ${consequence.expandedConsequences!.length} children for node ${node.id} from Firestore`);
          }
          newMap.set(node.id, consequence.expandedConsequences!);

          return newMap;
        });
      }
    },
    [findConsequenceByNodeId]
  );

  // Function to expand a consequence node
  const handleExpandConsequence = useCallback(
    async (nodeId: string, consequence: Consequence) => {
      if (!session?.user?.email) {
        console.error("No user email available");
        return;
      }

      // Check if already expanded
      if (expandedNodes.has(nodeId)) {
        console.log("Node already expanded");
        return;
      }

      // Set loading state
      setLoadingNodes((prev) => new Set(prev).add(nodeId));

      try {
        console.log(`🌳 Expanding consequence: "${consequence.nombre}" (nodeId: ${nodeId})`);
        console.log(`📌 Original decision: "${decision}"`);
        console.log(`📍 Decision ID: "${decisionId || 'N/A'}"`);

        if (!decisionId) {
          console.warn("⚠️ No decisionId provided - expansion will not be persisted to Firestore");
        }

        const childConsequences = await felipeService.expandConsequence(
          decisionId || "",
          nodeId,
          decision,
          consequence,
          session.user.email
        );

        console.log(`✅ Got ${childConsequences.length} child consequences for ${nodeId}`);

        // Collapse siblings and add new expansion atomically
        const parts = nodeId.split("-");
        const parentId = parts.slice(0, -1).join("-") || "root";

        setExpandedNodes((prev) => {
          const newMap = new Map(prev);

          // First, remove all expanded nodes that share the same parent
          const keysToRemove: string[] = [];
          newMap.forEach((value, key) => {
            const keyParts = key.split("-");
            const keyParent = keyParts.slice(0, -1).join("-") || "root";

            // If this is a sibling (same parent, different node)
            if (keyParent === parentId && key !== nodeId) {
              console.log(`🗑️  Removing sibling: ${key}`);
              keysToRemove.push(key);
              // Also remove any descendants
              newMap.forEach((_, descendantKey) => {
                if (descendantKey.startsWith(key + "-")) {
                  console.log(`🗑️  Removing descendant: ${descendantKey}`);
                  keysToRemove.push(descendantKey);
                }
              });
            }
          });

          keysToRemove.forEach(key => newMap.delete(key));

          // Then add the new expansion
          newMap.set(nodeId, childConsequences);
          console.log(`✅ Expanded ${nodeId} with ${childConsequences.length} children`);

          return newMap;
        });
      } catch (error) {
        console.error("Error expanding consequence:", error);
      } finally {
        // Remove loading state
        setLoadingNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }
    },
    [session, expandedNodes]
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
      {selectedConsequence && selectedNodeId && (
        <div className="w-1/3">
          <DetailPanel
            consequence={selectedConsequence}
            nodeId={selectedNodeId}
            isExpanded={expandedNodes.has(selectedNodeId)}
            isLoading={loadingNodes.has(selectedNodeId)}
            onClose={() => {
              setSelectedConsequence(null);
              setSelectedNodeId(null);
            }}
            onExpand={() => handleExpandConsequence(selectedNodeId, selectedConsequence)}
          />
        </div>
      )}
    </div>
  );
}
