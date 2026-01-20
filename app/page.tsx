"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

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

          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-[#002060] font-light">
              Secure platform for managing recruitment and crewing operations.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full px-4 py-3 bg-[#0080C0] hover:bg-[#006BA0] text-white font-semibold rounded-lg transition-colors duration-300 text-sm"
            >
              Proceed to Login
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#80A0C0] font-light">
            This is a secure system. All access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
