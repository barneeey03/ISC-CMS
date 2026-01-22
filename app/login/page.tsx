"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const ADMIN_USERS: Record<string, string> = {
  "angel@interworld.com": "admin123",
};

const SUPER_ADMIN_USERS: Record<string, string> = {
  "melba123@interworld.com": "superadmin123",
  "herms123@interworld.com": "superadmin123",
  "adrianne123@interworld.com": "superadmin123",
};

export default function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<"admin" | "super-admin" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    let userRole: "admin" | "super-admin" | null = null;

    if (role === "admin" && ADMIN_USERS[email] === password) {
      userRole = "admin";
    } else if (role === "super-admin" && SUPER_ADMIN_USERS[email] === password) {
      userRole = "super-admin";
    }

    if (!userRole) {
      setError("Invalid email or password for selected role.");
      setIsLoading(false);
      return;
    }

    login(email, userRole);
    router.push(
      userRole === "admin"
        ? "/admin/dashboard"
        : "/super-admin/dashboard"
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative"
      style={{
        backgroundImage: "url('/maritime-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-4 flex justify-center">
            <Image
              src="/isc-logo.png"
              alt="Interworld Shipping Corporation Logo"
              width={250}
              height={250}
              priority
            />
          </div>

          <div className="text-center -mt-2">
            <h1 className="text-lg font-extrabold text-[#0080C0] mb-1">
              INTER-WORLD SHIPPING CORPORATION
            </h1>
            <p className="text-sm font-light text-[#002060]">
              Recruitment & Crewing Management System
            </p>
            <div className="mt-2 h-1 w-16 bg-linear-to-r from-[#60A0C0] to-[#0080C0] mx-auto rounded-full"></div>
          </div>

          {!role ? (
            <div className="mt-8 space-y-3">
              <p className="text-center text-sm font-semibold text-[#002060]">
                Select your role to continue
              </p>
              <button
                onClick={() => setRole("admin")}
                className="w-full px-4 py-3 bg-[#0080C0] text-white rounded-lg"
              >
                Admin Login
              </button>
              <button
                onClick={() => setRole("super-admin")}
                className="w-full px-4 py-3 bg-[#002060] text-white rounded-lg"
              >
                Super Admin Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {error && (
                <p className="text-center text-red-600 text-sm">{error}</p>
              )}

              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-2 border rounded-lg pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-[#0080C0] text-white rounded-lg"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                onClick={() => setRole(null)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
