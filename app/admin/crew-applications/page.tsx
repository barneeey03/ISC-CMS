"use client";

import { useState, useMemo, useCallback } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { dataStore } from "@/app/lib/dataStore";
import { CrewMember } from "@/app/lib/type";
import { Plus, Eye, Edit2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";

export default function CrewApplications() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [crews, setCrews] = useState<CrewMember[]>(dataStore.getAllCrews());
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "disapproved"
  >("all");

  const [sortBy, setSortBy] = useState<"name" | "status">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const perPage = 8;

  const refreshCrews = useCallback(() => {
    setCrews(dataStore.getAllCrews());
  }, []);

  const handleApprove = (id: string) => {
    dataStore.updateCrew(id, { status: "approved" });
    refreshCrews();
    setSelectedCrew(null);
  };

  const handleDisapprove = (id: string) => {
    dataStore.updateCrew(id, { status: "disapproved" });
    refreshCrews();
    setSelectedCrew(null);
  };

  const handleDelete = (id: string) => {
    dataStore.deleteCrew(id);
    refreshCrews();
  };

  const handleEdit = (crew: CrewMember) => {
    setEditCrew(crew);
    setShowEditForm(true);
  };

  const filteredCrews = useMemo(() => {
    let list = crews.filter((crew) => {
      const q = searchQuery.toLowerCase();
      return (
        crew.fullName.toLowerCase().includes(q) ||
        crew.emailAddress.toLowerCase().includes(q) ||
        crew.mobileNumber.includes(q) ||
        crew.gender.toLowerCase().includes(q)
      );
    });

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc"
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      }
      return sortDir === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    });

    return list;
  }, [crews, searchQuery, statusFilter, sortBy, sortDir]);

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
      doc.text(`Email: ${crew.emailAddress}`, 14, y + 6);
      doc.text(`Gender: ${crew.gender}`, 14, y + 12);
      doc.text(`Contact #: ${crew.mobileNumber}`, 14, y + 18);
      doc.text(`DOB: ${crew.dateOfBirth}`, 14, y + 24);
      doc.text(`Status: ${crew.status.toUpperCase()}`, 14, y + 30);

      y += 40;
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

        <div className="flex-1 min-h-screen lg:ml-64 bg-white">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b">
            <div className="flex justify-between px-6 py-4">
              <h1 className="text-lg font-bold">Crew Applications</h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-20 px-6 pb-10">
            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search name, email, contact, sex..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-3 border rounded-lg"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disapproved">Disapproved</option>
              </select>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-1/2 px-4 py-3 border rounded-lg"
                >
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>

                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as any)}
                  className="w-1/2 px-4 py-3 border rounded-lg"
                >
                  <option value="asc">ASC</option>
                  <option value="desc">DESC</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={exportPDF}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg"
                >
                  Export PDF
                </button>

                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Crew
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white rounded-xl shadow border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Contact #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Date of Birth</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {paginatedCrews.map((crew) => (
                    <tr key={crew.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{crew.fullName}</td>
                      <td className="px-6 py-4">{crew.emailAddress}</td>
                      <td className="px-6 py-4 capitalize">{crew.gender}</td>
                      <td className="px-6 py-4">{crew.mobileNumber}</td>
                      <td className="px-6 py-4">{crew.dateOfBirth}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${crew.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : crew.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"}`}>
                          {crew.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => setSelectedCrew(crew)}>
                          <Eye className="w-5 h-5 text-blue-600" />
                        </button>
                        <button onClick={() => handleEdit(crew)}>
                          <Edit2 className="w-5 h-5 text-green-600" />
                        </button>
                        <button onClick={() => handleDelete(crew.id)}>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between mt-6">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </div>

          {selectedCrew && (
            <CrewDetailsModal
              crew={selectedCrew}
              onClose={() => setSelectedCrew(null)}
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
