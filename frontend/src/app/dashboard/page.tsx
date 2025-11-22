"use client";

// react
import { useState } from "react";

// hooks
import { useAuth } from "@/hooks/useAuth";

// services
import { felipeService, ApiError, type Consequence } from "@/services";

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [decision, setDecision] = useState("");
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decision.trim()) {
      setError("Por favor describe la decisión que estás considerando tomar");
      return;
    }

    setLoading(true);
    setError("");
    setConsequences([]);

    try {
      const consequences = await felipeService.startDecisionMaking({
        message: decision,
        email: session?.user?.email || "",
      });

      setConsequences(consequences);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Hubo un error al analizar las consecuencias. Intenta de nuevo."
        );
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probabilidad: number) => {
    if (probabilidad >= 60)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (probabilidad >= 30)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const isHighImpact = (probabilidad: number) => probabilidad <= 10;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      {/* Header con usuario */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Felipe - Asistente de Decisiones
        </h1>

        {session?.user && (
          <div className="flex items-center gap-4">
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
        <div className="mx-auto max-w-4xl">
          {/* Input form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <label
              htmlFor="decision"
              className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
            >
              Describe la decisión que estás considerando tomar
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Ej: Voy a renunciar a mi trabajo actual para emprender mi propio negocio"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Analizando..." : "Analizar consecuencias"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </form>

          {/* Consequences list */}
          {consequences.length > 0 && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Posibles consecuencias de tu decisión
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Ordenadas por probabilidad de ocurrencia. Las probabilidades son
                independientes.
              </p>
              <div className="space-y-4">
                {consequences.map((consequence, index) => (
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
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Impactos potenciales:
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {consequence.impactos.map((impacto, i) => (
                          <li key={i}>{impacto}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
