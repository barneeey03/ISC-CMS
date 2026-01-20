"use client";

import { useState, useMemo, useCallback } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { dataStore } from "@/app/lib/dataStore";
import { CrewMember } from "@/app/lib/type";
import { Plus, Eye, Edit2, Trash2, Download, Search } from "lucide-react";
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

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
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
        crew.mobileNumber.includes(q) ||
        crew.gender.toLowerCase().includes(q)
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
      doc.text(`Email: ${crew.emailAddress}`, 14, y + 6);
      doc.text(`Gender: ${crew.gender}`, 14, y + 12);
      doc.text(`Contact #: ${crew.mobileNumber}`, 14, y + 18);
      doc.text(`DOB: ${crew.dateOfBirth}`, 14, y + 24);
      doc.text(`Age: ${getAge(crew.dateOfBirth)}`, 14, y + 30);
      doc.text(`Status: ${crew.status.toUpperCase()}`, 14, y + 36);

      y += 45;
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
                  placeholder="Search name, email, contact, gender..."
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
                  <option value="approved">Approved</option>
                  <option value="disapproved">Disapproved</option>
                </select>
              </div>

              {/* BUTTONS AT RIGHT */}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">Contact #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800">DOB</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y bg-white">
                  {paginatedCrews.map((crew) => (
                    <tr key={crew.id} className="hover:bg-blue-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{crew.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{crew.emailAddress}</td>
                      <td className="px-6 py-4 capitalize text-gray-600">{crew.gender}</td>
                      <td className="px-6 py-4 text-gray-600">{getAge(crew.dateOfBirth)}</td>
                      <td className="px-6 py-4 text-gray-600">{crew.mobileNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{crew.dateOfBirth}</td>

                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${crew.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : crew.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"}`}>
                          {crew.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 flex justify-center gap-3">
                        <button
                          onClick={() => setSelectedCrew(crew)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(crew)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(crew.id)}
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
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
