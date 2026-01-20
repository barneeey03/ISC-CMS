"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  email: string | null;
  role: "admin" | "super-admin" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role: "admin" | "super-admin") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const login = (email: string, role: "admin" | "super-admin") => {
    const authData = { email, role, isAuthenticated: true };
    localStorage.setItem("auth", JSON.stringify(authData));

    setAuth({
      email,
      role,
      isAuthenticated: true,
      isLoading: false,
      login,
      logout,
    });

    setIsLoading(false); // ✅ IMPORTANT
  };

  const logout = () => {
    localStorage.removeItem("auth");

    setAuth({
      email: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      logout,
    });

    setIsLoading(false); // ✅ IMPORTANT
    router.push("/");
  };

  const [auth, setAuth] = useState<AuthContextType>({
    email: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    login,
    logout,
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");

    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      setAuth({
        email: parsedAuth.email || null,
        role: parsedAuth.role || null,
        isAuthenticated: parsedAuth.isAuthenticated || false,
        isLoading: false,
        login,
        logout,
      });
    } else {
      setAuth({
        email: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        login,
        logout,
      });
    }

    setIsLoading(false); // ✅ IMPORTANT
  }, []);

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

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
