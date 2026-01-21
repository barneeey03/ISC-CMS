"use client";

import { useState, useCallback } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import { FileText, CheckCircle, XCircle } from "lucide-react";

export default function SuperAdminCrewApplications() {
  const [crews, setCrews] = useState(dataStore.getAllCrews());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "disapproved"
  >("all");

  const refreshCrews = useCallback(() => {
    setCrews(dataStore.getAllCrews());
  }, []);

  const handleApprove = (id: string) => {
    dataStore.updateCrew(id, { status: "approved" });
    refreshCrews();
  };

  const handleDisapprove = (id: string) => {
    dataStore.updateCrew(id, { status: "disapproved" });
    refreshCrews();
  };

  const filteredCrews = crews.filter((crew) => {
    const matchesSearch =
      crew.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.mobileNumber.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || crew.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCrews = crews.filter((c) => c.status === "pending");
  const approvedCrews = crews.filter((c) => c.status === "approved");
  const disapprovedCrews = crews.filter((c) => c.status === "disapproved");

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen bg-[#f5f7fb]">
        <SuperAdminSidebar />

        {/* MAIN CONTENT */}
        {/* IMPORTANT: add `ml-64` if sidebar is fixed */}
        <div className="flex-1 min-h-screen ml-64">
          {/* HEADER */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-gray-900">
                Crew Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and manage all crew applications
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{crews.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pendingCrews.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvedCrews.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Disapproved</p>
                <p className="text-2xl font-bold text-red-600">
                  {disapprovedCrews.length}
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6">
            {/* SEARCH BAR */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, email, or mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disapproved">Disapproved</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CREW LIST */}
            {filteredCrews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <FileText className="w-16 h-16 text-gray-400 opacity-60 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Applications Found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCrews.map((crew) => {
                  const statusLabel =
                    crew.status.charAt(0).toUpperCase() + crew.status.slice(1);

                  const statusClass =
                    crew.status === "pending"
                      ? "bg-blue-100 text-blue-600 border-blue-200"
                      : crew.status === "approved"
                      ? "bg-green-100 text-green-600 border-green-200"
                      : "bg-red-100 text-red-600 border-red-200";

                  return (
                    <div
                      key={crew.id}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
                          <p className="text-sm text-gray-700">{crew.emailAddress}</p>
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
                          <p className="text-sm text-gray-700">{crew.nationality}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            Status
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>

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
                            Vessel Type
                          </p>
                          <p className="text-sm text-gray-700">
                            {crew.vesselType || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {crew.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(crew.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                        )}

                        {crew.status !== "disapproved" && (
                          <button
                            onClick={() => handleDisapprove(crew.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Disapprove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
