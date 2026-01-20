"use client";

import { useState, useMemo, useCallback } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { dataStore } from "@/app/lib/dataStore";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { Plus, Eye, Edit2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { CrewMember } from "@/app/lib/type";

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
      const matchesSearch =
        crew.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crew.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crew.mobileNumber.includes(searchQuery);

      const matchesStatus =
        statusFilter === "all" || crew.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    list = list.sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc"
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      } else {
        return sortDir === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
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
      doc.text(`Status: ${crew.status.toUpperCase()}`, 14, y + 12);
      y += 20;

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

        <div className="flex-1 min-h-screen lg:ml-64 bg-[#ffffff]">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-[#ffffff] border-b border-[#374151]">
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-lg font-bold text-black">
                Crew Applications
              </h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-20 px-6 pb-10">

            {/* SEARCH + FILTER + ACTIONS (Aligned) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#ffffff] text-black"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-3 rounded-lg border border-[#374151] bg-[#ffffff] text-black"
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
                  className="w-1/2 px-4 py-3 rounded-lg border border-[#374151] bg-[#ffffff] text-black"
                >
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>

                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value as any)}
                  className="w-1/2 px-4 py-3 rounded-lg border border-[#374151] bg-[#ffffff] text-black"
                >
                  <option value="asc">ASC</option>
                  <option value="desc">DESC</option>
                </select>
              </div>

              {/* ACTION BUTTONS (ALIGNED) */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={exportPDF}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-black"
                >
                  Export PDF
                </button>

                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-black font-semibold rounded-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Crew
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedCrews.map((crew) => (
                    <tr key={crew.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {crew.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {crew.emailAddress}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            crew.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : crew.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {crew.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => setSelectedCrew(crew)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Eye className="w-5 h-5 text-blue-600" />
                        </button>

                        <button
                          onClick={() => handleEdit(crew)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-5 h-5 text-green-600" />
                        </button>

                        <button
                          onClick={() => handleDelete(crew.id)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* MODALS */}
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
