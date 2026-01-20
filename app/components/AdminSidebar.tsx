"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { LogOut, LayoutDashboard, Users, XCircle } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-accent text-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-primary/30">
        <h2 className="text-xl font-extrabold text-white">Admin Panel</h2>
        <p className="text-xs text-white/75 mt-1">ISC Recruitment</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/admin/dashboard")
              ? "bg-primary text-white shadow-md"
              : "text-white/70 hover:bg-accent/80 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-semibold">Dashboard</span>
        </Link>

        <Link
          href="/admin/crew-applications"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/admin/crew-applications")
              ? "bg-primary text-white shadow-md"
              : "text-white/70 hover:bg-accent/80 hover:text-white"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-semibold">Crew Applications</span>
        </Link>

        <Link
          href="/admin/disapproved-crew"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/admin/disapproved-crew")
              ? "bg-primary text-white shadow-md"
              : "text-white/70 hover:bg-accent/80 hover:text-white"
          }`}
        >
          <XCircle className="w-5 h-5" />
          <span className="font-semibold">Disapproved Crew</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary/30">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold shadow-md"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
