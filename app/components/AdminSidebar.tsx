"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { LogOut, LayoutDashboard, Users, XCircle, Menu, X } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const [isOpen, setIsOpen] = React.useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/crew-applications", label: "Crew Applications", icon: Users },
    { href: "/admin/crew-documentation", label: "Crew Documentation", icon: XCircle },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push("/login-page");
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg text-white"
        style={{ backgroundColor: "#1F2937" }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? "w-64" : "w-0"}
          fixed top-0 left-0
          h-screen
          transition-all duration-300
          flex flex-col
          shadow-lg
          z-40
        `}
        style={{ backgroundColor: "#1F2937" }}
      >
        {/* Header */}
        <div className="p-4 border-b shrink-0" style={{ borderColor: "#374151" }}>
          <div className="leading-tight">
            <h1 className="font-bold text-white text-sm">Admin</h1>
            <p className="text-[10px] mt-1 text-gray-300">ISC Recruitment</p>
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
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 
                       text-sm font-medium text-gray-400 hover:text-white"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Logout modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Logout
            </h2>
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
