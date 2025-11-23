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
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <div className="flex items-center gap-3">
          <div className="text-white">
            <h1 className="text-xl md:text-2xl font-bold">Felipe</h1>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <Link
            href="/sign-in"
            className="text-white/90 hover:text-white transition-colors text-xs md:text-sm font-medium"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-start justify-between px-4 py-8 md:px-16 md:py-16">
        {/* Hero Text */}
        <div className="max-w-4xl">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-8">
            Probabilidades reales.
            <br />
            Futuros simulados.
          </h1>
        </div>

        {/* Bottom Section */}
        <div className="flex w-full flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8">
          {/* Bottom Left Text */}
          <div className="flex flex-col gap-2">
            <p className="text-base md:text-lg font-semibold text-white">Felipe AI</p>
            <div className="flex gap-3 md:gap-4 text-xs md:text-sm text-white/80">
              <span>Analiza</span>
              <span>Predice</span>
              <span>Decide</span>
            </div>
          </div>

          {/* Bottom Right - Description and CTA */}
          <div className="max-w-2xl w-full md:w-auto">
            <p className="text-white/90 text-sm md:text-base lg:text-lg mb-4 md:mb-6 leading-relaxed">
              Transforma decisiones complejas en futuros simulados con
              inteligencia artificial de última generación.{" "}
              <span className="text-white font-medium">
                Combinando IA avanzada y mercados predictivos.
              </span>
            </p>

            <div className="flex gap-3 md:gap-4">
              <Link href="/sign-in" className="flex-1 md:flex-none">
                <button className="w-full md:w-auto px-6 md:px-8 py-2.5 md:py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm md:text-base cursor-pointer">
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
