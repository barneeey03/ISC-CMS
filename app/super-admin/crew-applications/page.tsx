"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { CrewMember } from "@/app/lib/dataStore";

import {
  Eye,
  Edit2,
  Trash2,
  Download,
  Search,
} from "lucide-react";
import jsPDF from "jspdf";

import {
  updateCrewInFirestore,
  updateCrewDatabaseInFirestore,
  deleteCrewFromFirestore,
} from "@/app/lib/crewservice";

import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function SuperAdminCrewApplications() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "proposed" | "approved" | "disapproved" | "fooled"
  >("all");

  const [page, setPage] = useState(1);
  const perPage = 8;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    const crewRef = collection(db, "crewApplications");

    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const list: CrewMember[] = [];
      snapshot.forEach((doc) => {
        list.push({
          ...(doc.data() as any),
          id: doc.id,
        });
      });
      setCrews(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleApprove = async (id: string) => {
    const payload = { status: "approved" };

    await updateCrewInFirestore(id, payload);
    await updateCrewDatabaseInFirestore(id, payload);

    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleDisapprove = async (id: string, reconsider?: boolean) => {
    const payload = {
      status: reconsider ? "fooled" : "disapproved",
    };

    await updateCrewInFirestore(id, payload);
    await updateCrewDatabaseInFirestore(id, payload);

    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleProposed = async (id: string) => {
    const payload = { status: "proposed" };

    await updateCrewInFirestore(id, payload);
    await updateCrewDatabaseInFirestore(id, payload);

    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const handleFooled = async (id: string) => {
    const payload = { status: "fooled" };

    await updateCrewInFirestore(id, payload);
    await updateCrewDatabaseInFirestore(id, payload);

    setSelectedCrew(null);
    setStatusFilter("all");
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    await deleteCrewFromFirestore(deleteTargetId);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  };

  const handleEdit = (crew: CrewMember) => {
    setEditCrew(crew);
  };

  const getAge = (dob: string | undefined) => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "—";

    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // 🔥 FIXED: expiryDate now uses signedOff
  const getVesselInfo = (crew: CrewMember) => {
    const lastVessel = crew.vesselExperience?.[0];

    return {
      vesselName: lastVessel?.vesselName || "—",
      principal: lastVessel?.principal || "—",
      signedOff: lastVessel?.signedOn || "—",  // <--- CHANGE THIS
    };
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
      const vesselInfo = getVesselInfo(crew);

      doc.setFontSize(11);
      doc.text(`${index + 1}. ${crew.fullName}`, 14, y);
      doc.text(`Rank: ${crew.presentRank}`, 14, y + 6);
      doc.text(`Vessel Type: ${crew.vesselType}`, 14, y + 12);
      doc.text(`Vessel Name: ${vesselInfo.vesselName}`, 14, y + 18);
      doc.text(`Principal: ${vesselInfo.principal}`, 14, y + 24);
      doc.text(`Signed Off: ${vesselInfo.signedOff}`, 14, y + 30);
      doc.text(`Age: ${getAge(crew.dateOfBirth)}`, 14, y + 36);
      doc.text(`Email: ${crew.emailAddress}`, 14, y + 42);
      doc.text(`Status: ${crew.status.toUpperCase()}`, 14, y + 48);
      doc.text(`Remarks: ${crew.remarks || "—"}`, 14, y + 54);

      y += 60;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("crew_applications_report.pdf");
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex">
        <SuperAdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-gray-50">
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
              <h1 className="text-xl font-semibold tracking-tight">
                Crew Applications
              </h1>
            </div>
          </div>

          <div className="pt-24 px-6 pb-10">
            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  <option value="assigned">Active</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg shadow-sm hover:bg-blue-600 transition"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
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
                      Vessel Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">
                      Signed Off
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
                  {paginatedCrews.map((crew) => {
                    const vesselInfo = getVesselInfo(crew);

                    return (
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
                          {vesselInfo.vesselName}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {vesselInfo.principal}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {vesselInfo.signedOff}
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
                                ? "bg-orange-400 text-gray-900"
                                : crew.status === "fooled"
                                ? "bg-orange-100 text-orange-700"
                                : crew.status === "assigned"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"}`}
                          >
                            {crew.status === "assigned" ? "ACTIVE" : crew.status.toUpperCase()}
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
                    );
                  })}
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

          {editCrew && (
            <CrewApplicationForm
              mode="edit"
              crew={editCrew}
              onClose={() => setEditCrew(null)}
              onSuccess={() => {}}
            />
          )}

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
