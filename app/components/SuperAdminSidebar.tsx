"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  XCircle,
  Database,
  Ship,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import LogoGlobe from "@/public/logo-globe.png";
import { useAuth } from "@/app/context/AuthContext";

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const [isOpen, setIsOpen] = React.useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const menuItems = [
    { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/crew-applications", label: "Crew Applications", icon: Users },
    { href: "/super-admin/disapproved-crew", label: "Disapproved Crew", icon: XCircle },
    { href: "/super-admin/crew-database", label: "Crew Database", icon: Database },
    { href: "/super-admin/vessel-assignment", label: "Vessel Assignment", icon: Ship },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push("/login-page");
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg text-white"
        style={{ backgroundColor: "#1F2937" }}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-40
          transition-all duration-300
          flex flex-col shadow-lg
          ${isOpen ? "w-64" : "w-0"}
          lg:w-64
        `}
        style={{ backgroundColor: "#1F2937" }}
      >
        {/* Logo */}
        <div className="p-4 border-b shrink-0" style={{ borderColor: "#374151" }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={LogoGlobe.src} alt="Logo" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-white text-sm">Super Admin</h1>
              <p className="text-[10px] mt-1 text-gray-300">ISC Full System</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 rounded-lg flex items-center gap-3
                  text-sm font-medium transition-all
                  ${isActive ? "text-white" : "text-gray-400 hover:text-white"}
                `}
                style={{
                  backgroundColor: isActive ? "#2563EB" : "transparent",
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: "#374151" }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirm Logout</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
