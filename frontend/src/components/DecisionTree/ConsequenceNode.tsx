import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

export interface ConsequenceNodeData {
  label: string;
  probabilidad: number;
  isRoot?: boolean;
  hasPolymarketData?: boolean;
}

function ConsequenceNode({ data, selected }: NodeProps<ConsequenceNodeData>) {
  const { label, probabilidad, isRoot, hasPolymarketData } = data;

  const getNodeColor = (prob: number) => {
    if (prob >= 60) return "bg-green-500";
    if (prob >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isRoot) {
    return (
      <div
        className={`rounded-xl border-2 bg-blue-600 px-6 py-4 shadow-lg ${
          selected ? "border-blue-400 ring-2 ring-blue-300" : "border-blue-700"
        }`}
      >
        <Handle type="source" position={Position.Right} className="!bg-blue-400" />
        <div className="text-center">
          <p className="text-sm font-bold text-white">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border-2 ${getNodeColor(probabilidad)} px-5 py-3 shadow-md transition-all hover:scale-105 ${
        selected ? "border-white ring-2 ring-white/50" : "border-transparent"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <p className="text-xs font-semibold text-white">{label}</p>
          {hasPolymarketData && (
            <span className="text-[10px]" title="Datos de Polymarket disponibles">
              📊
            </span>
          )}
        </div>
        <p className="mt-1 text-[10px] font-bold text-white/90">{probabilidad}%</p>
      </div>
    </div>
  );
}

export default memo(ConsequenceNode);
