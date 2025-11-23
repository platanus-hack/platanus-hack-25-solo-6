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
    <main className="min-h-screen bg-[#F4F3ED] relative px-4">
      <div className="absolute left-4 top-4 md:left-6 md:top-6">
        <Image
          src="/assets/images/logo/dark.png"
          alt="Felipe logo"
          width={100}
          height={100}
          className="w-20 h-20 md:w-[150px] md:h-[150px]"
        />
      </div>

      {/* Centered content */}
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1
          className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 text-center text-gray-900 px-4"
          style={{ fontFamily: "var(--font-space-grotesk), Georgia, serif" }}
        >
          Hola, soy Felipe
        </h1>

        <p className="text-base md:text-lg text-center text-gray-600 mb-8 md:mb-10 max-w-2xl px-4">
          Soy un asistente que te ayudará a tomar decisiones complejas en futuros simulados combinando LLM y mercados predictivos
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center w-full max-w-[400px] h-12 md:h-14 mx-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center h-full w-12 md:w-14 border-r border-gray-300">
            <Image
              src="/assets/images/logos/google.svg"
              alt="Google logo"
              width={20}
              height={20}
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </div>

          <span className="flex-1 text-center font-space-grotesk text-sm md:text-base text-gray-800">
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
