"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { felipeService, type Decision, ApiError } from "@/services";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mis Decisiones
        </h1>

        {session?.user && (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Nueva Decisión
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          {loading && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Cargando decisiones...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
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
            <div className="space-y-4">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/history/${decision.id}`}>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                          {decision.decision}
                        </h3>
                      </Link>
                      <div className="mb-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {decision.consequences.length} consecuencias
                        </span>
                        <span>•</span>
                        <span>{formatDate(decision.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {decision.consequences.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {c.nombre} ({c.probabilidad}%)
                          </span>
                        ))}
                        {decision.consequences.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            +{decision.consequences.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/history/${decision.id}`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => handleDelete(decision.id)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
