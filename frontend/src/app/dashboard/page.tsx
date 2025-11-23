"use client";

// react
import { useState, useEffect } from "react";

// next
import Image from "next/image";

// react-icons
import { TbBinaryTree } from "react-icons/tb";

// hooks
import { useAuth } from "@/hooks/useAuth";

// services
import { felipeService, ApiError, type Consequence } from "@/services";

// components
import { DecisionTree } from "@/components";

type ViewMode = "list" | "tree";

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [decision, setDecision] = useState("");
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [decisionId, setDecisionId] = useState<string | undefined>(undefined);
  const [inputType, setInputType] = useState<"decision" | "question">(
    "decision"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile and force list view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode("list");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decision.trim()) {
      setError("Por favor escribe tu decisión o pregunta");
      return;
    }

    setLoading(true);
    setError("");
    setConsequences([]);

    try {
      const result = await felipeService.startDecisionMaking({
        message: decision,
        email: session?.user?.email || "",
      });

      setConsequences(result.consequences);
      setDecisionId(result.decisionId);
      setInputType(result.inputType || "decision");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Hubo un error al procesar tu solicitud. Intenta de nuevo.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuery = () => {
    setDecision("");
    setConsequences([]);
    setDecisionId(undefined);
    setError("");
    setInputType("decision");
  };

  const getProbabilityColor = (probabilidad: number) => {
    if (probabilidad >= 60)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (probabilidad >= 30)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header Mejorado */}
      <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Felipe
              </h1>

              <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">
                Decision Assistant
              </p>
            </div>
          </div>

          {session?.user && (
            <div className="flex items-center gap-2 md:gap-4">
              {consequences.length > 0 && (
                <button
                  onClick={handleNewQuery}
                  className="flex items-center gap-1 md:gap-2 rounded-lg bg-blue-600 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  <TbBinaryTree className="h-3 w-3 md:h-4 md:w-4 -rotate-90" />
                  <span className="hidden sm:inline">Explorar futuros</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              )}
              <a
                href="/history"
                className="flex items-center gap-1 md:gap-2 rounded-lg bg-gray-100 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-3 w-3 md:h-4 md:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Historial</span>
              </a>
              <button
                onClick={() => signOut()}
                className="flex md:hidden items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Cerrar sesión"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Salir
              </button>
              <div className="hidden md:flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ""}
                    className="h-8 w-8 rounded-full ring-2 ring-blue-500"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-blue-500">
                    {session.user.name?.charAt(0) ||
                      session.user.email?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="hidden md:block rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                title="Cerrar sesión"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center py-4 md:py-8">
        <div
          className="mx-auto w-full"
          style={{
            maxWidth:
              viewMode === "tree" && consequences.length > 0
                ? "none"
                : "1200px",
          }}
        >
          {/* Input form - Diseño Minimalista */}
          <div className="mb-6 md:mb-8 mx-auto px-4 md:px-6" style={{ maxWidth: "1200px" }}>
            {!consequences.length && (
              <div className="mb-8 md:mb-12 text-center">
                <h2 className="mb-3 md:mb-4 text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
                  Simula el futuro
                </h2>

                <p className="text-base md:text-xl text-gray-600 dark:text-gray-400 px-4">
                  Analiza decisiones o explora escenarios futuros con IA +
                  predictores de mercado
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <input
                    type="text"
                    id="decision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 md:px-6 md:py-4 text-base md:text-lg text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                    placeholder="Describe tu decisión..."
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? "Analizando..." : "Analizar"}
                  </button>
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 md:p-4 text-xs md:text-sm text-red-600 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Consequences visualization */}
          {consequences.length > 0 && (
            <div>
              {/* Header with view toggle - Simple */}
              <div
                className="mb-4 md:mb-6 mx-auto px-4 md:px-6 flex items-center justify-between"
                style={{ maxWidth: "1200px" }}
              >
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {consequences.length} Posibles Futuros
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {viewMode === "list"
                      ? "Ordenadas por probabilidad"
                      : "Haz clic en un nodo para expandir"}
                  </p>
                </div>

                {/* View mode toggle - Hidden on mobile */}
                {!isMobile && (
                  <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700">
                    <button
                      onClick={() => setViewMode("tree")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === "tree"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                      }`}
                    >
                      Árbol
                    </button>

                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors dark:border-gray-700 ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                      }`}
                    >
                      Lista
                    </button>
                  </div>
                )}
              </div>

              {/* Tree view - Hidden on mobile */}
              {viewMode === "tree" && !isMobile && (
                <DecisionTree
                  decision={decision}
                  consequences={consequences}
                  decisionId={decisionId}
                />
              )}

              {/* List view - Always shown on mobile */}
              {(viewMode === "list" || isMobile) && (
                <div
                  className="mx-auto space-y-3 md:space-y-4 px-4 md:px-6"
                  style={{ maxWidth: "1200px" }}
                >
                  {consequences.map((consequence, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                              {consequence.nombre}
                            </h3>

                            {consequence.polymarketInfluenced && (
                              <span
                                className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] md:text-xs font-medium text-white w-fit"
                                title="Influenciado por datos de Polymarket"
                              >
                                📊 Polymarket
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 md:px-3 py-1 text-xs md:text-sm font-medium flex-shrink-0 ${getProbabilityColor(
                            consequence.probabilidad
                          )}`}
                        >
                          {consequence.probabilidad}%
                        </span>
                      </div>
                      <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-600 dark:text-gray-400">
                        {consequence.descripcion}
                      </p>
                      <div className="mb-3 md:mb-4">
                        <p className="mb-2 text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                          Impactos potenciales:
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {consequence.impactos.map((impacto, i) => (
                            <li key={i}>{impacto}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Polymarket markets for list view */}
                      {consequence.relatedMarkets &&
                        consequence.relatedMarkets.length > 0 && (
                          <div className="mt-3 md:mt-4 border-t border-gray-200 pt-3 md:pt-4 dark:border-gray-700">
                            <p className="mb-2 text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                              📊 Mercados relacionados en Polymarket (
                              {consequence.relatedMarkets.length}):
                            </p>
                            <div className="space-y-2">
                              {consequence.relatedMarkets
                                .slice(0, 3)
                                .map((market) => (
                                  <div
                                    key={market.id}
                                    className="rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <p className="text-[11px] md:text-xs text-gray-900 dark:text-white">
                                      {market.question}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 md:gap-3 text-[10px] text-gray-600 dark:text-gray-400">
                                      <span>
                                        Prob:{" "}
                                        <strong>{market.probability}%</strong>
                                      </span>
                                      <a
                                        href={market.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                      >
                                        Ver →
                                      </a>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
