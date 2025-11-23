"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { felipeService, type Decision, type Consequence, ApiError } from "@/services";
import { DecisionTree } from "@/components";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TbBinaryTree } from "react-icons/tb";

type ViewMode = "list" | "tree";

export default function DecisionDetailPage() {
  const params = useParams();
  const decisionId = params.id as string;
  const { session, signOut } = useAuth();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  useEffect(() => {
    const loadDecision = async () => {
      if (!session?.user?.email || !decisionId) return;

      try {
        const loadedDecision = await felipeService.getDecisionById(
          decisionId,
          session.user.email
        );
        setDecision(loadedDecision);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Error al cargar la decisión");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDecision();
  }, [session, decisionId]);

  const getProbabilityColor = (probabilidad: number) => {
    if (probabilidad >= 60)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (probabilidad >= 30)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const isHighImpact = (probabilidad: number) => probabilidad <= 10;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Felipe
              </h1>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Decision Assistant
              </p>
            </div>
          </div>

          {session?.user && (
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg
                  className="h-4 w-4"
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
                Historial
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                <TbBinaryTree className="h-4 w-4 -rotate-90" />
                Explorar futuros
              </Link>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
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
                <div className="hidden sm:block">
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
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
      <main className="flex-1 p-6">
        {/* Title and breadcrumb */}
        {decision && (
          <div className="mx-auto mb-6" style={{ maxWidth: "64rem" }}>
            <Link
              href="/history"
              className="mb-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver al Historial
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {decision.decision}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creada el {formatDate(decision.createdAt)}
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Cargando decisión...
            </p>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && decision && (
          <div className="mx-auto w-full" style={{ maxWidth: viewMode === "tree" ? "none" : "64rem" }}>
            {/* Header with view toggle */}
            <div className="mb-6 mx-auto flex items-center justify-between" style={{ maxWidth: "64rem" }}>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Consecuencias analizadas ({decision.consequences.length})
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {viewMode === "list"
                    ? "Ordenadas por probabilidad de ocurrencia."
                    : "Haz click en un nodo para ver sus detalles."}{" "}
                  Las probabilidades son independientes.
                </p>
              </div>

              {/* View mode toggle */}
              <div className="flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
                <button
                  onClick={() => setViewMode("tree")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "tree"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Árbol
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  Lista
                </button>
              </div>
            </div>

            {/* Tree view */}
            {viewMode === "tree" && (
              <DecisionTree
                decision={decision.decision}
                consequences={decision.consequences}
              />
            )}

            {/* List view */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {decision.consequences.map((consequence: Consequence, index: number) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-6 shadow-sm ${
                      isHighImpact(consequence.probabilidad)
                        ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950"
                        : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {consequence.nombre}
                          </h3>
                          {isHighImpact(consequence.probabilidad) && (
                            <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
                              Alto impacto
                            </span>
                          )}
                          {consequence.polymarketInfluenced && (
                            <span
                              className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white"
                              title="Influenciado por datos de Polymarket"
                            >
                              📊 Polymarket
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getProbabilityColor(
                          consequence.probabilidad
                        )}`}
                      >
                        {consequence.probabilidad}%
                      </span>
                    </div>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      {consequence.descripcion}
                    </p>
                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Impactos potenciales:
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {consequence.impactos.map((impacto, i) => (
                          <li key={i}>{impacto}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Polymarket markets for list view */}
                    {consequence.relatedMarkets &&
                      consequence.relatedMarkets.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                                  <p className="text-xs text-gray-900 dark:text-white">
                                    {market.question}
                                  </p>
                                  <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-600 dark:text-gray-400">
                                    <span>
                                      Prob: <strong>{market.probability}%</strong>
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
      </main>
    </div>
  );
}
