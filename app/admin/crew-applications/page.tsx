"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { CrewMember } from "@/app/lib/dataStore";

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
  getCrewApplications,
  updateCrewInFirestore,
  deleteCrewFromFirestore,
} from "@/app/lib/crewservice";

export default function CrewApplications() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "proposed" | "approved" | "disapproved" | "fooled"
  >("all");

  const [page, setPage] = useState(1);
  const perPage = 8;

  // NEW: Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const refreshCrews = useCallback(async () => {
    const list = await getCrewApplications();
    setCrews(list);
  }, []);

  useEffect(() => {
    refreshCrews();
  }, [refreshCrews]);

  // RESET PAGE WHEN FILTER OR SEARCH CHANGES
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleProposed = async (id: string) => {
    await updateCrewInFirestore(id, { status: "proposed" });
    await refreshCrews();
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleApprove = async (id: string) => {
    await updateCrewInFirestore(id, { status: "approved" });
    await refreshCrews();
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleDisapprove = async (id: string, reconsider?: boolean) => {
    if (reconsider) {
      await updateCrewInFirestore(id, { status: "fooled" });
    } else {
      await updateCrewInFirestore(id, { status: "disapproved" });
    }
    await refreshCrews();
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleFooled = async (id: string) => {
    await updateCrewInFirestore(id, { status: "fooled" });
    await refreshCrews();
    setSelectedCrew(null);
    setStatusFilter("all");
  };

  // Delete action (triggered by modal)
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    await deleteCrewFromFirestore(deleteTargetId);
    await refreshCrews();
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };

  const handleEdit = (crew: CrewMember) => {
    setEditCrew(crew);
    setShowEditForm(true);
  };

  const getAge = (dob: string | undefined) => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "—";

    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

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

    return list;
  }, [crews, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCrews.length / perPage);
  const paginatedCrews = filteredCrews.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Crew Applications Report", 14, 20);

    let y = 35;

    paginatedCrews.forEach((crew, index) => {
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${crew.fullName}`, 14, y);
      doc.text(`Rank: ${crew.presentRank}`, 14, y + 6);
      doc.text(`Vessel Type: ${crew.vesselType}`, 14, y + 12);
      doc.text(`Age: ${getAge(crew.dateOfBirth)}`, 14, y + 18);
      doc.text(`Email: ${crew.emailAddress}`, 14, y + 24);
      doc.text(`Status: ${crew.status.toUpperCase()}`, 14, y + 30);
      doc.text(`Remarks: ${crew.remarks || "—"}`, 14, y + 36);

      y += 50;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("crew_applications_report.pdf");
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-gray-50">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
              <h1 className="text-xl font-semibold tracking-tight">
                Crew Applications
              </h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-24 px-6 pb-10">
            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* SEARCH */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700"
                />
              </div>

              {/* STATUS DROPDOWN */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full outline-none text-sm text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="proposed">Proposed</option>
                  <option value="approved">Approved</option>
                  <option value="disapproved">Disapproved</option>
                  <option value="fooled">Fooled</option>
                </select>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg shadow-sm hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>

                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-500 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Crew
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white rounded-xl shadow border">
              <table className="min-w-full divide-y">
                <thead className="bg-blue-200">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Vessel Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Age
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y bg-white">
                  {paginatedCrews.map((crew) => (
                    <tr key={crew.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 text-center text-gray-600">
                        {crew.presentRank}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-800">
                        {crew.fullName}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {crew.vesselType}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {getAge(crew.dateOfBirth)}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {crew.emailAddress}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${crew.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : crew.status === "proposed"
                              ? "bg-yellow-100 text-yellow-700"
                              : crew.status === "pending"
                              ? "bg-orange-600 text-gray-900"
                              : crew.status === "fooled"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"}`}
                        >
                          {crew.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center text-gray-600">
                        {crew.remarks || "No remarks"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSelectedCrew(crew)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEdit(crew)}
                            className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTargetId(crew.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              onSuccess={refreshCrews}
            />
          )}

          {showEditForm && editCrew && (
            <CrewApplicationForm
              mode="edit"
              crew={editCrew}
              onClose={() => setShowEditForm(false)}
              onSuccess={refreshCrews}
            />
          )}

          {/* DELETE CONFIRMATION MODAL */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/3 border">
                <h2 className="text-lg font-bold mb-3">Delete Confirmation</h2>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this crew?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    No
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    onClick={confirmDelete}
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
