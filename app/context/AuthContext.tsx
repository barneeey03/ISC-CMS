"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  email: string | null;
  role: "admin" | "super-admin" | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthContextType>({
    email: null,
    role: null,
    isAuthenticated: false,
    logout: () => {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      setAuth((prev) => ({
        ...prev,
        ...parsedAuth,
      }));
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("auth");
    setAuth({
      email: null,
      role: null,
      isAuthenticated: false,
      logout,
    });
    router.push("/");
  };

  const value: AuthContextType = {
    ...auth,
    logout,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0080C0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#002060]">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
