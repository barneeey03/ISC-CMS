"use client";

import { useState, useCallback } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import { FileText, Search, Filter } from "lucide-react";
import { useSearchParams, Suspense } from "next/navigation";
import Loading from "./loading";

export default function CrewDatabase() {
  const [crews, setCrews] = useState(dataStore.getAllCrews());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "disapproved">("approved");
  const searchParams = useSearchParams();

  const filteredCrews = crews.filter((crew) => {
    const matchesSearch =
      crew.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crew.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crew.mobileNumber.includes(searchTerm);

    if (filterStatus === "all") {
      return matchesSearch;
    }
    return matchesSearch && crew.status === filterStatus;
  });

  return (
    <ProtectedRoute requiredRole="super-admin">
      <Suspense fallback={<Loading />}>
        <div className="flex">
          <SuperAdminSidebar />
          <div className="flex-1 bg-[#F5F9FC] min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-[#E0E8F0] p-6">
              <h1 className="text-3xl font-extrabold text-[#002060]">Crew Database</h1>
              <p className="text-[#80A0C0] mt-1">Access complete crew information and records</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#80A0C0]" />
                      <input
                        type="text"
                        placeholder="Name, email, or phone"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                      />
                    </div>
                  </div>

                  {/* Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="disapproved">Disapproved</option>
                      <option value="all">All</option>
                    </select>
                  </div>

                  {/* Total Records */}
                  <div className="flex items-end">
                    <div className="w-full px-4 py-2.5 bg-[#E8F4F8] rounded-lg border border-[#B0D8E8]">
                      <p className="text-xs font-semibold text-[#80A0C0]">Total Records</p>
                      <p className="text-2xl font-extrabold text-[#0080C0]">{filteredCrews.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crew List */}
              {filteredCrews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FileText className="w-16 h-16 text-[#80A0C0] opacity-30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#002060] mb-2">No Crew Found</h3>
                  <p className="text-[#80A0C0]">
                    {searchTerm ? "No crew members match your search criteria." : "No approved crew members in the database yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCrews.map((crew) => (
                    <div
                      key={crew.id}
                      className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#0080C0] hover:shadow-lg transition-shadow"
                    >
                      {/* Top Row */}
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
                          <p className="text-xs font-semibold text-[#80A0C0]">Gender</p>
                          <p className="text-sm text-[#002060] capitalize">{crew.gender}</p>
                        </div>
                      </div>

                      {/* Middle Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold text-[#80A0C0]">Nationality</p>
                          <p className="text-sm text-[#002060]">{crew.nationality}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#80A0C0]">Mobile</p>
                          <p className="text-sm text-[#002060]">{crew.mobileNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#80A0C0]">Civil Status</p>
                          <p className="text-sm text-[#002060]">{crew.civilStatus}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#80A0C0]">Vessel Type</p>
                          <p className="text-sm text-[#002060]">{crew.vesselType || "Not specified"}</p>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="mb-4 pb-4 border-b border-[#E0E8F0]">
                        <p className="text-xs font-semibold text-[#80A0C0] mb-1">Address</p>
                        <p className="text-sm text-[#002060]">{crew.completeAddress}</p>
                      </div>

                      {/* Education Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-[#E8F4F8] rounded-lg border border-[#B0D8E8]">
                          <p className="text-xs font-semibold text-[#0080C0] mb-1">High School</p>
                          <p className="text-sm text-[#002060]">
                            {crew.highSchool.schoolName || "Not provided"}
                            {crew.highSchool.yearGraduated && ` (${crew.highSchool.yearGraduated})`}
                          </p>
                        </div>
                        <div className="p-3 bg-[#E8F4F8] rounded-lg border border-[#B0D8E8]">
                          <p className="text-xs font-semibold text-[#0080C0] mb-1">College</p>
                          <p className="text-sm text-[#002060]">
                            {crew.college.schoolName || "Not provided"}
                            {crew.college.course && ` - ${crew.college.course}`}
                            {crew.college.yearGraduated && ` (${crew.college.yearGraduated})`}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#80A0C0]">Status</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            crew.status === "approved"
                              ? "bg-[#28A745] text-white"
                              : crew.status === "pending"
                                ? "bg-[#FFA500] text-white"
                                : "bg-[#DC3545] text-white"
                          }`}
                        >
                          {crew.status.charAt(0).toUpperCase() + crew.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Suspense>
    </ProtectedRoute>
  );
}
