"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: "admin" | "super-admin";
}) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || role !== requiredRole) {
      router.push("/");
    }
  }, [isAuthenticated, role, router, requiredRole, isLoading]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (role !== requiredRole) return null;

  return <>{children}</>;
}
