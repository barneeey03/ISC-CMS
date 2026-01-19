"use client";

import React from "react"

import { useState, useCallback } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import { Ship, Users, ArrowRight } from "lucide-react";

export default function VesselAssignment() {
  const [crews, setCrews] = useState(dataStore.getAllCrews());
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [vesselAssignments, setVesselAssignments] = useState<
    { crewId: string; vesselName: string; vesselType: string; principal: string; assignedDate: string }[]
  >([]);
  const [formData, setFormData] = useState({
    vesselName: "",
    vesselType: "",
    principal: "",
  });

  const refreshCrews = useCallback(() => {
    setCrews(dataStore.getAllCrews());
  }, []);

  const approvedCrews = crews.filter((c) => c.status === "approved");

  const handleAssignVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrew || !formData.vesselName || !formData.vesselType || !formData.principal) {
      return;
    }

    const assignment = {
      crewId: selectedCrew,
      vesselName: formData.vesselName,
      vesselType: formData.vesselType,
      principal: formData.principal,
      assignedDate: new Date().toISOString().split("T")[0],
    };

    setVesselAssignments([...vesselAssignments, assignment]);

    // Update crew with vessel info
    dataStore.updateCrew(selectedCrew, {
      vesselType: formData.vesselType,
    });

    // Reset form
    setFormData({ vesselName: "", vesselType: "", principal: "" });
    setSelectedCrew(null);
    refreshCrews();
  };

  const getCrewName = (crewId: string) => {
    const crew = crews.find((c) => c.id === crewId);
    return crew?.fullName || "Unknown";
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 bg-[#F5F9FC] min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-[#E0E8F0] p-6">
            <h1 className="text-3xl font-extrabold text-[#002060]">Vessel Assignment</h1>
            <p className="text-[#80A0C0] mt-1">Assign and manage crew vessel assignments</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Assignment Form */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-extrabold text-[#002060] mb-4 flex items-center gap-2">
                  <Ship className="w-6 h-6 text-[#0080C0]" />
                  Assign Vessel
                </h2>

                <form onSubmit={handleAssignVessel} className="space-y-4">
                  {/* Crew Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">
                      Select Crew Member
                    </label>
                    <select
                      value={selectedCrew || ""}
                      onChange={(e) => setSelectedCrew(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                      required
                    >
                      <option value="">Choose a crew member</option>
                      {approvedCrews.map((crew) => (
                        <option key={crew.id} value={crew.id}>
                          {crew.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vessel Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">
                      Vessel Name
                    </label>
                    <input
                      type="text"
                      value={formData.vesselName}
                      onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                      placeholder="e.g., MV Ocean Star"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                      required
                    />
                  </div>

                  {/* Vessel Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">
                      Vessel Type
                    </label>
                    <select
                      value={formData.vesselType}
                      onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                      required
                    >
                      <option value="">Select vessel type</option>
                      <option value="Container Ship">Container Ship</option>
                      <option value="Tanker">Tanker</option>
                      <option value="Bulk Carrier">Bulk Carrier</option>
                      <option value="General Cargo">General Cargo</option>
                      <option value="RoRo Ship">RoRo Ship</option>
                      <option value="Refrigerated">Refrigerated</option>
                    </select>
                  </div>

                  {/* Principal/Company */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002060] mb-2">
                      Principal / Shipping Company
                    </label>
                    <input
                      type="text"
                      value={formData.principal}
                      onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                      placeholder="e.g., Global Shipping Ltd."
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedCrew || !formData.vesselName || !formData.vesselType || !formData.principal}
                    className="w-full px-4 py-2.5 bg-[#0080C0] hover:bg-[#006BA0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Assign Vessel
                  </button>
                </form>

                <div className="mt-6 p-4 bg-[#E8F4F8] rounded-lg border border-[#B0D8E8]">
                  <p className="text-xs font-semibold text-[#0080C0] mb-2">Available Crew</p>
                  <p className="text-2xl font-extrabold text-[#0080C0]">{approvedCrews.length}</p>
                </div>
              </div>

              {/* Assignments List */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-extrabold text-[#002060] flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-[#0080C0]" />
                  Current Assignments ({vesselAssignments.length})
                </h2>

                {vesselAssignments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Users className="w-16 h-16 text-[#80A0C0] opacity-30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#002060] mb-2">No Assignments Yet</h3>
                    <p className="text-[#80A0C0]">Create your first vessel assignment to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vesselAssignments.map((assignment, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#28A745]"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs font-semibold text-[#80A0C0]">Crew Member</p>
                            <p className="text-lg font-bold text-[#002060]">{getCrewName(assignment.crewId)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#80A0C0]">Assigned Date</p>
                            <p className="text-sm text-[#002060]">{assignment.assignedDate}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-[#E0E8F0]">
                          <div>
                            <p className="text-xs font-semibold text-[#80A0C0]">Vessel Name</p>
                            <p className="font-bold text-[#0080C0]">{assignment.vesselName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#80A0C0]">Vessel Type</p>
                            <p className="text-sm text-[#002060]">{assignment.vesselType}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#80A0C0]">Principal</p>
                            <p className="text-sm text-[#002060]">{assignment.principal}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="px-3 py-1 bg-[#28A745] text-white text-xs font-bold rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
