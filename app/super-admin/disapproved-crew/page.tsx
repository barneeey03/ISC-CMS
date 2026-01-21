"use client";

import { useState, useCallback } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import { FileText, RotateCcw, Trash2 } from "lucide-react";

export default function SuperAdminDisapprovedCrew() {
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
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <SuperAdminSidebar />

        {/* MAIN CONTENT */}
        <div className="flex-1 min-h-screen ml-64">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Disapproved Crew
            </h1>
            <p className="text-gray-500 mt-1">
              {disapprovedCrews.length} disapproved applications
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {disapprovedCrews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <FileText className="w-16 h-16 text-gray-400 opacity-60 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Disapproved Applications
                </h3>
                <p className="text-gray-500">
                  There are no disapproved crew members at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {disapprovedCrews.map((crew) => (
                  <div
                    key={crew.id}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    {/* Top Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Full Name
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {crew.fullName}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Email
                        </p>
                        <p className="text-sm text-gray-700">
                          {crew.emailAddress}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Age
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {crew.age} years
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Nationality
                        </p>
                        <p className="text-sm text-gray-700">
                          {crew.nationality}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Mobile
                        </p>
                        <p className="text-sm text-gray-700">
                          {crew.mobileNumber}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Address
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-1">
                          {crew.completeAddress}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          Civil Status
                        </p>
                        <p className="text-sm text-gray-700">
                          {crew.civilStatus}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleReconsider(crew.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reconsider Applicant
                      </button>

                      <button
                        onClick={() => handleDelete(crew.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
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
