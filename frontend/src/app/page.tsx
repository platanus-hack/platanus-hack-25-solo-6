import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/cover.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Felipe</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/sign-in"
            className="text-white/90 hover:text-white transition-colors text-sm font-medium"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-start justify-between px-8 py-12 md:px-16 md:py-16">
        {/* Hero Text */}
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-8">
            Explora futuros con
            <br />
            IA que comprende.
          </h1>
        </div>

        {/* Bottom Section */}
        <div className="flex w-full flex-col md:flex-row items-end justify-between gap-8">
          {/* Bottom Left Text */}
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-white">Felipe AI</p>
            <div className="flex gap-4 text-sm text-white/80">
              <span>Analiza</span>
              <span>Predice</span>
              <span>Decide</span>
            </div>
          </div>

          {/* Bottom Right - Description and CTA */}
          <div className="max-w-2xl">
            <p className="text-white/90 text-base md:text-lg mb-6 leading-relaxed">
              Transforma decisiones complejas en futuros simulados con
              inteligencia artificial de última generación.{" "}
              <span className="text-white font-medium">
                Combinando IA avanzada y mercados predictivos.
              </span>
            </p>

            <div className="flex gap-4">
              <Link href="/sign-in">
                <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold cursor-pointer">
                  Comenzar
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
