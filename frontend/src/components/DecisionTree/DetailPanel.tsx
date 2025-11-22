import type { Consequence } from "@/services";

interface DetailPanelProps {
  consequence: Consequence | null;
  onClose: () => void;
}

export default function DetailPanel({ consequence, onClose }: DetailPanelProps) {
  if (!consequence) return null;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 60) return "text-green-600 dark:text-green-400";
    if (prob >= 30) return "text-yellow-600 dark:text-yellow-400";
    if (prob <= 10) return "text-purple-600 dark:text-purple-400";
    return "text-red-600 dark:text-red-400";
  };

  const isHighImpact = consequence.probabilidad <= 10;

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {consequence.nombre}
              </h3>
              {isHighImpact && (
                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
                  Alto impacto
                </span>
              )}
            </div>
            <p className={`mt-1 text-2xl font-bold ${getProbabilityColor(consequence.probabilidad)}`}>
              {consequence.probabilidad}% probabilidad
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripción</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{consequence.descripcion}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Impactos potenciales</h4>
          <ul className="space-y-2">
            {consequence.impactos.map((impacto, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{impacto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
