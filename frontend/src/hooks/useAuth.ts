"use client";

// next-auth
import { useSession, signIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/");
  };

  return {
    session,
    status,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    signIn: () => signIn("google"),
    signOut: handleSignOut,
  };
}
