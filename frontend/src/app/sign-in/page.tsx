"use client";

// react
import { Suspense } from "react";

// next
import Image from "next/image";
import { useSearchParams } from "next/navigation";

// next-auth
import { signIn } from "next-auth/react";

// hooks
import { useAuth } from "@/hooks/useAuth";

function SignInContent() {
  const { isLoading } = useAuth();
  const searchParams = useSearchParams();

  const handleGoogleSignIn = () => {
    const callbackUrl = searchParams.get("callbackUrl") || "/chat";
    signIn("google", { callbackUrl });
  };

  return (
    <main className="min-h-screen bg-[#F4F3ED] relative">
      <div className="absolute">
        <Image
          src="/assets/images/logo/dark.png"
          alt="Felipe logo"
          width={150}
          height={150}
        />
      </div>

      {/* Centered content */}
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1
          className="text-4xl font-bold mb-4 text-center text-gray-900"
          style={{ fontFamily: "var(--font-space-grotesk), Georgia, serif" }}
        >
          Hola, soy Felipe
        </h1>

        <p className="text-lg text-center text-gray-600 mb-10 max-w-2xl px-4">
          Soy un asistente que te ayudará a tomar decisiones complejas en futuros simulados combinando LLM y mercados predictivos
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center w-[400px] max-w-full h-14 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center h-full w-14 border-r border-gray-300">
            <Image
              src="/assets/images/logos/google.svg"
              alt="Google logo"
              width={24}
              height={24}
            />
          </div>

          <span className="flex-1 text-center font-space-grotesk text-base text-gray-800">
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión con Google"}
          </span>
        </button>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F3ED] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002636] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
