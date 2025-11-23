// next
import type { Metadata } from "next";

// styles
import "./globals.css";

// context - auth provider
import AuthProvider from "@/context/AuthProvider";

// fonts
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Felipe, tu copiloto para cuestionar decisiones",
  description:
    "Felipe, tu copiloto para cuestionar decisiones y ver futuros posibles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.className} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
