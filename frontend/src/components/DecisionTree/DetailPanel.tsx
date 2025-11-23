import type { Consequence } from "@/services";

interface DetailPanelProps {
  consequence: Consequence | null;
  nodeId: string;
  isExpanded: boolean;
  isLoading: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export default function DetailPanel({
  consequence,
  nodeId,
  isExpanded,
  isLoading,
  onClose,
  onExpand
}: DetailPanelProps) {
  if (!consequence) return null;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 60) return "text-green-600 dark:text-green-400";
    if (prob >= 30) return "text-yellow-600 dark:text-yellow-400";
    if (prob <= 10) return "text-purple-600 dark:text-purple-400";
    return "text-red-600 dark:text-red-400";
  };

  const isHighImpact = consequence.probabilidad <= 10;
  const hasPolymarketData = consequence.relatedMarkets && consequence.relatedMarkets.length > 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

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
              {consequence.polymarketInfluenced && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white" title="Influenciado por datos de Polymarket">
                  📊 Polymarket
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

      {/* Simulate Button */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <button
          onClick={onExpand}
          disabled={isExpanded || isLoading}
          className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
            isExpanded
              ? "cursor-not-allowed bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : isLoading
              ? "cursor-wait bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Simulando...
            </span>
          ) : isExpanded ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Ya expandida
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Simular consecuencias
            </span>
          )}
        </button>
        {isExpanded && (
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Las consecuencias ya fueron generadas y están visibles en el árbol
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripción</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{consequence.descripcion}</p>
        </div>

        <div className="mb-6">
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

        {/* Polymarket Markets */}
        {hasPolymarketData && (
          <div className="mb-6">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <span>📊 Mercados de Polymarket</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({consequence.relatedMarkets.length})
              </span>
            </h4>
            <div className="space-y-3">
              {consequence.relatedMarkets.map((market) => (
                <div
                  key={market.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {market.question}
                    </p>
                  </div>
                  <div className="mb-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Probabilidad:</span>
                      <span className={`font-bold ${getProbabilityColor(market.probability)}`}>
                        {market.probability}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Volumen:</span>
                      <span>{formatCurrency(market.volume)}</span>
                    </div>
                  </div>
                  <a
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver en Polymarket
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Polymarket Queries */}
        {consequence.polymarketQueries && consequence.polymarketQueries.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Búsquedas sugeridas en Polymarket
            </h4>
            <div className="flex flex-wrap gap-2">
              {consequence.polymarketQueries.map((query, index) => (
                <a
                  key={index}
                  href={`https://polymarket.com/search?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {query}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
