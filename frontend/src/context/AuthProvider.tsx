"use client";

// react
import { ReactNode } from "react";

// next-auth
import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
