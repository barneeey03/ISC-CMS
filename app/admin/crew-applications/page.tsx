"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { CrewMember } from "@/app/lib/type";

import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
  Search,
} from "lucide-react";

import jsPDF from "jspdf";

import {
  updateCrewInFirestore,
  deleteCrewFromFirestore,
} from "@/app/lib/crewservice";

import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

type CrewStatus =
  | "pending"
  | "proposed"
  | "approved"
  | "disapproved"
  | "fooled"
  | "assigned";

export default function CrewApplications() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CrewStatus | "all">("all");

  // NEW: Highlight dropdown
  const [highlightFilter, setHighlightFilter] = useState<
    "all" | "highlighted"
  >("all");

  const [page, setPage] = useState(1);
  const perPage = 8;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* ============================
     REAL-TIME FIRESTORE SYNC
  ============================ */
  useEffect(() => {
    const ref = collection(db, "crewApplications");

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: CrewMember[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as any),
        id: doc.id,
      }));
      setCrews(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, highlightFilter]);

  /* ============================
     ACTION HANDLERS
  ============================ */
  const handleApprove = async (id: string) => {
    await updateCrewInFirestore(id, { status: "approved" });
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleDisapprove = async (id: string, reconsider?: boolean) => {
    await updateCrewInFirestore(id, {
      status: reconsider ? "fooled" : "disapproved",
    });
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleProposed = async (id: string) => {
    await updateCrewInFirestore(id, { status: "proposed" });
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleFooled = async (id: string) => {
    await updateCrewInFirestore(id, { status: "fooled" });
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteCrewFromFirestore(deleteTargetId);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };

  /* ============================
     HELPERS (SYNCED WITH SUPER ADMIN)
  ============================ */
  const getAge = (dob?: string) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "—";
    return Math.abs(
      new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970
    );
  };

  const getLatestVessel = (crew: CrewMember) => {
    const vessels = crew.vesselExperience || [];

    const sorted = [...vessels].sort((a, b) => {
      const aDate = a.signedOn ? new Date(a.signedOn).getTime() : 0;
      const bDate = b.signedOn ? new Date(b.signedOn).getTime() : 0;
      return bDate - aDate;
    });

    return sorted[0];
  };

  const getVesselInfo = (crew: CrewMember) => {
    const lastVessel = getLatestVessel(crew);

    return {
      vesselType: lastVessel?.vesselType || crew.vesselType || "—",
      vesselName: lastVessel?.vesselName || "—",
      principal: lastVessel?.principal || "—",
      signedOn: lastVessel?.signedOn || "—",
      signedOff: lastVessel?.signedOff || "—",
    };
  };

  const calculateDaysOnboard = (crew: CrewMember) => {
    const last = getLatestVessel(crew);
    if (!last?.signedOn) return null;

    const start = new Date(last.signedOn).getTime();
    const end = last.signedOff ? new Date(last.signedOff).getTime() : Date.now();

    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /* ============================
     FILTERING + PAGINATION
  ============================ */
  const filteredCrews = useMemo(() => {
    let list = crews.filter((crew) => {
      const q = searchQuery.toLowerCase();
      return (
        crew.fullName.toLowerCase().includes(q) ||
        crew.emailAddress.toLowerCase().includes(q) ||
        crew.mobileNumber.includes(q)
      );
    });

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (highlightFilter === "highlighted") {
      list = list.filter((crew) => {
        const days = calculateDaysOnboard(crew);
        return days !== null && days < 70;
      });
    }

    return list;
  }, [crews, searchQuery, statusFilter, highlightFilter]);

  const totalPages = Math.ceil(filteredCrews.length / perPage);
  const paginatedCrews = filteredCrews.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ============================
     PDF EXPORT (SAME AS SUPER ADMIN)
  ============================ */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Crew Applications Report", 14, 20);

    let y = 35;

    paginatedCrews.forEach((crew, index) => {
      const vessel = getVesselInfo(crew);
      const days = calculateDaysOnboard(crew);
      const isHighlighted = days !== null && days < 70;

      doc.setFontSize(11);
      doc.text(`${index + 1}. ${crew.fullName}`, 14, y);
      doc.text(`Rank: ${crew.presentRank}`, 14, y + 6);
      doc.text(`Vessel Type: ${vessel.vesselType}`, 14, y + 12);
      doc.text(`Vessel Name: ${vessel.vesselName}`, 14, y + 18);
      doc.text(`Principal: ${vessel.principal}`, 14, y + 24);
      doc.text(`Signed On: ${vessel.signedOn}`, 14, y + 30);
      doc.text(`Signed Off: ${vessel.signedOff}`, 14, y + 36);
      doc.text(`Days Onboard: ${days ?? "—"}`, 14, y + 42);

      doc.text(`Age: ${getAge(crew.dateOfBirth)}`, 14, y + 48);
      doc.text(`Email: ${crew.emailAddress}`, 14, y + 54);
      doc.text(
        `Status: ${
          crew.status === "assigned" ? "ACTIVE" : crew.status.toUpperCase()
        }`,
        14,
        y + 60
      );
      doc.text(`Remarks: ${crew.remarks || "—"}`, 14, y + 66);

      if (isHighlighted) {
        doc.setTextColor(255, 165, 0);
        doc.text("⚠️ <70 days onboard", 150, y + 6);
        doc.setTextColor(0, 0, 0);
      }

      y += 78;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("crew_applications_report.pdf");
  };

  /* ============================
     RENDER
  ============================ */
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-gray-50">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
              <h1 className="text-xl font-semibold">Crew Applications</h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-24 px-6 pb-10">
            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              {/* SEARCH BAR */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border shadow-sm h-12">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, contact..."
                  className="w-full outline-none text-sm"
                />
              </div>

              {/* STATUS FILTER */}
              <div className="flex items-center px-4 py-3 bg-white rounded-lg border shadow-sm h-12">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as CrewStatus | "all")
                  }
                  className="w-full outline-none text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="proposed">Proposed</option>
                  <option value="approved">Approved</option>
                  <option value="disapproved">Disapproved</option>
                  <option value="fooled">Fooled</option>
                  <option value="assigned">Active</option>
                </select>
              </div>

              {/* HIGHLIGHT FILTER */}
              <div className="flex items-center px-4 py-3 bg-white rounded-lg border shadow-sm h-12">
                <select
                  value={highlightFilter}
                  onChange={(e) =>
                    setHighlightFilter(e.target.value as "all" | "highlighted")
                  }
                  className="w-full outline-none text-sm"
                >
                  <option value="all">All Crew</option>
                  <option value="highlighted">Highlight {"<70 days"}</option>
                </select>
              </div>

              {/* EMPTY SPACE */}
              <div className="hidden md:block" />

              {/* EXPORT + ADD CREW */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg h-12"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>

                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg h-12"
                >
                  <Plus className="w-4 h-4" />
                  Add Crew
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
              <div className="max-h-130 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-blue-200 sticky top-0">
                    <tr>
                      {[
                        "Rank",
                        "Name",
                        "Vessel Type",
                        "Vessel Name",
                        "Principal",
                        "Signed Off",
                        "Age",
                        "Email",
                        "Status",
                        "Remarks",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-xs font-semibold text-center"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedCrews.map((crew) => {
                      const vessel = getVesselInfo(crew);
                      const days = calculateDaysOnboard(crew);
                      const isHighlighted = days !== null && days < 70;

                      return (
                        <tr
                          key={crew.id}
                          className={`hover:bg-blue-50 ${
                            isHighlighted
                              ? "bg-red-100 border-l-4 border-red-600"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            {crew.presentRank}
                          </td>
                          <td className="px-3 py-2 text-center font-medium">
                            {crew.fullName}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {vessel.vesselType}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {vessel.vesselName}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {vessel.principal}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {vessel.signedOff}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getAge(crew.dateOfBirth)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {crew.emailAddress}
                          </td>

                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${
                                crew.status === "approved" ||
                                crew.status === "assigned"
                                  ? "bg-green-100 text-green-700"
                                  : crew.status === "pending"
                                  ? "bg-orange-400 text-gray-900"
                                  : crew.status === "proposed"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : crew.status === "fooled"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {crew.status === "assigned"
                                ? "ACTIVE"
                                : crew.status.toUpperCase()}
                            </span>
                          </td>

                          <td className="px-3 py-2 text-center">
                            {crew.remarks || "—"}
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setSelectedCrew(crew)}
                                className="p-2 bg-blue-100 rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setEditCrew(crew)}
                                className="p-2 bg-green-100 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setDeleteTargetId(crew.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 bg-red-100 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {selectedCrew && (
            <CrewDetailsModal
              crew={selectedCrew}
              onClose={() => setSelectedCrew(null)}
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
              onProposed={handleProposed}
              onFooled={handleFooled}
            />
          )}

          {showAddForm && (
            <CrewApplicationForm
              mode="add"
              onClose={() => setShowAddForm(false)}
              onSuccess={() => setShowAddForm(false)}
            />
          )}

          {editCrew && (
            <CrewApplicationForm
              mode="edit"
              crew={editCrew}
              onClose={() => setEditCrew(null)}
              onSuccess={() => setEditCrew(null)}
            />
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl">
                <h2 className="font-bold mb-4">Delete Confirmation</h2>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    No
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
