"use client";

import { useState, useCallback } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import { FileText, RotateCcw, Trash2 } from "lucide-react";

export default function DisapprovedCrew() {
  const [crews, setCrews] = useState(dataStore.getAllCrews());

  const refreshCrews = useCallback(() => {
    setCrews(dataStore.getAllCrews());
  }, []);

  const handleReconsider = (id: string) => {
    dataStore.updateCrew(id, { status: "approved" });
    refreshCrews();
  };

  const handleDelete = (id: string) => {
    dataStore.deleteCrew(id);
    refreshCrews();
  };

  const disapprovedCrews = crews.filter((c) => c.status === "disapproved");

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 bg-[#F5F9FC] min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-[#E0E8F0] p-6">
            <h1 className="text-3xl font-extrabold text-[#002060]">Disapproved Crew</h1>
            <p className="text-[#80A0C0] mt-1">{disapprovedCrews.length} disapproved applications</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {disapprovedCrews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-[#80A0C0] opacity-30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#002060] mb-2">No Disapproved Applications</h3>
                <p className="text-[#80A0C0]">There are no disapproved crew members at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disapprovedCrews.map((crew) => (
                  <div
                    key={crew.id}
                    className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#DC3545] hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Full Name</p>
                        <p className="text-lg font-bold text-[#002060]">{crew.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Email</p>
                        <p className="text-sm text-[#002060]">{crew.emailAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Age</p>
                        <p className="text-lg font-bold text-[#002060]">{crew.age} years</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Nationality</p>
                        <p className="text-sm text-[#002060]">{crew.nationality}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-[#E0E8F0]">
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Mobile</p>
                        <p className="text-sm text-[#002060]">{crew.mobileNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Address</p>
                        <p className="text-sm text-[#002060] line-clamp-1">{crew.completeAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#80A0C0]">Civil Status</p>
                        <p className="text-sm text-[#002060]">{crew.civilStatus}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReconsider(crew.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0080C0] hover:bg-[#006BA0] text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reconsider Applicant
                      </button>
                      <button
                        onClick={() => handleDelete(crew.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#DC3545] hover:bg-[#c82333] text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
