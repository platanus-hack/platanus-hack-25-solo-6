import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex w-full max-w-3xl items-center justify-center bg-white dark:bg-black">
        <Link href="/sign-in">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            Iniciar sesión
          </button>
        </Link>
      </main>
    </div>
  );
}
