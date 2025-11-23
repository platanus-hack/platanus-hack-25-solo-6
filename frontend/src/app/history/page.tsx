"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { felipeService, type Decision, ApiError } from "@/services";
import Link from "next/link";
import { TbBinaryTree } from "react-icons/tb";

export default function HistoryPage() {
  const { session, signOut } = useAuth();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDecisions = async () => {
      if (!session?.user?.email) return;

      try {
        const userDecisions = await felipeService.getDecisions(
          session.user.email
        );
        setDecisions(userDecisions);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Error al cargar las decisiones");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDecisions();
  }, [session]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const handleDelete = async (decisionId: string) => {
    if (!session?.user?.email) return;
    if (!confirm("¿Estás seguro de que quieres eliminar esta decisión?"))
      return;

    try {
      await felipeService.deleteDecision(decisionId, session.user.email);
      setDecisions(decisions.filter((d) => d.id !== decisionId));
    } catch (err) {
      console.error("Error deleting decision:", err);
      alert("Error al eliminar la decisión");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
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
              <Link
                href="/dashboard"
                className="flex items-center gap-1 md:gap-2 rounded-lg bg-blue-600 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                <TbBinaryTree className="h-3 w-3 md:h-4 md:w-4 -rotate-90" />
                <span className="hidden sm:inline">Explorar futuros</span>
                <span className="sm:hidden">Nuevo</span>
              </Link>
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
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 md:mb-6 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Historial
          </h2>

          {loading && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Cargando decisiones...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!loading && !error && decisions.length === 0 && (
            <div className="text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                No tienes decisiones guardadas aún.
              </p>
              <Link
                href="/dashboard"
                className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Crear tu primera decisión
              </Link>
            </div>
          )}

          {!loading && !error && decisions.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                    <div className="flex-1 w-full">
                      <Link href={`/history/${decision.id}`}>
                        <h3 className="mb-2 text-base md:text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                          {decision.decision}
                        </h3>
                      </Link>

                      <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {decision.consequences.length} futuros generados
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(decision.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {decision.consequences.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-gray-100 px-2 md:px-3 py-1 text-[10px] md:text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {c.nombre} ({c.probabilidad}%)
                          </span>
                        ))}
                        {decision.consequences.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 md:px-3 py-1 text-[10px] md:text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            +{decision.consequences.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Link
                        href={`/history/${decision.id}`}
                        className="flex-1 md:flex-none text-center rounded-md bg-blue-600 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(decision.id)}
                        className="flex-1 md:flex-none rounded-md bg-red-600 px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
