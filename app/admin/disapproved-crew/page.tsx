"use client";

import { useState, useCallback, useMemo } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { dataStore } from "@/app/lib/dataStore";
import {
  FileText,
  RotateCcw,
  Trash2,
  Search,
  Eye,
  X,
} from "lucide-react";

export default function DisapprovedCrew() {
  const [crews, setCrews] = useState(dataStore.getAllCrews());
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [selectedCrew, setSelectedCrew] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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

  const disapprovedCrews = useMemo(() => {
    let filtered = crews.filter((c) => c.status === "disapproved");

    // Search Filter
    if (search.trim() !== "") {
      filtered = filtered.filter((c) =>
        c.fullName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Date Filter
    if (dateFrom) {
      filtered = filtered.filter((c) => new Date(c.dateApplied) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter((c) => new Date(c.dateApplied) <= new Date(dateTo));
    }

    return filtered;
  }, [crews, search, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(disapprovedCrews.length / perPage);
  const paginatedCrews = disapprovedCrews.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-[#F5F9FC] min-h-screen lg:ml-64">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b border-[#E0E8F0] p-6">
            <h1 className="text-3xl font-extrabold text-[#002060]">
              Disapproved Crew
            </h1>
            <p className="text-[#80A0C0] mt-1">
              {disapprovedCrews.length} disapproved applications
            </p>
          </div>

          {/* CONTENT */}
          <div className="pt-28 px-6 pb-10">
            {/* SEARCH + FILTER */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-xs font-semibold text-[#6B7B8A]">
                    Search
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Search className="w-4 h-4 text-[#6B7B8A]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-[#E0E8F0]"
                      placeholder="Search by full name..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6B7B8A]">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#E0E8F0] mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#6B7B8A]">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-[#E0E8F0] mt-1"
                  />
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#F4F6FA]">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Email
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Age
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Nationality
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Applied On
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B7B8A]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCrews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center">
                        <FileText className="w-10 h-10 text-[#80A0C0] opacity-30 mx-auto mb-2" />
                        <div className="text-[#002060] font-bold">
                          No records found.
                        </div>
                        <div className="text-[#80A0C0] mt-1">
                          Try adjusting your filters.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCrews.map((crew) => (
                      <tr key={crew.id} className="border-b border-[#E0E8F0]">
                        <td className="px-6 py-4 text-center">
                          <div className="font-semibold text-[#002060]">
                            {crew.fullName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[#002060]">
                          {crew.emailAddress}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[#002060]">
                          {crew.age}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[#002060]">
                          {crew.nationality}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[#002060]">
                          {formatDate(crew.dateApplied)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setSelectedCrew(crew);
                                setShowModal(true);
                              }}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F4F6FA] hover:bg-[#E0E8F0] transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleReconsider(crew.id)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0080C0] hover:bg-[#006BA0] transition"
                              title="Reconsider"
                            >
                              <RotateCcw className="w-4 h-4 text-white" />
                            </button>

                            <button
                              onClick={() => handleDelete(crew.id)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#DC3545] hover:bg-[#c82333] transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-[#6B7B8A]">
                Page {page} of {totalPages || 1}
              </div>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border border-[#E0E8F0] hover:bg-[#F4F6FA] transition disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-[#E0E8F0] hover:bg-[#F4F6FA] transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* VIEW DETAILS MODAL */}
          {showModal && selectedCrew && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl w-11/12 md:w-3/4 lg:w-2/3 p-6 max-h-[80vh] overflow-hidden">
                {/* MODAL HEADER */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#002060]">
                    Crew Application Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-lg bg-[#F4F6FA] hover:bg-[#E0E8F0] transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* MODAL BODY - SCROLLABLE */}
                <div className="overflow-auto max-h-[70vh] pr-2">
                  {/* APPLICATION INFO */}
                  <div className="border border-[#E0E8F0] rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0080C0] mb-2">
                      Application Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Detail label="Date Applied" value={formatDate(selectedCrew.dateApplied)} />
                      <Detail label="Present Rank" value={selectedCrew.presentRank} />
                      <Detail label="Previous Salary" value={selectedCrew.prevSalary} />
                      <Detail label="Availability" value={formatDate(selectedCrew.dateOfAvailability)} />
                      <Detail label="Expected Salary" value={selectedCrew.expectedSalary} />
                      <Detail label="Position Applied" value={selectedCrew.province} />
                    </div>
                  </div>

                  {/* PERSONAL INFO */}
                  <div className="border border-[#E0E8F0] rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0080C0] mb-2">
                      Personal Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Detail label="Full Name" value={selectedCrew.fullName} />
                      <Detail label="Father's Name" value={selectedCrew.fathersName} />
                      <Detail label="Mother's Name" value={selectedCrew.mothersName} />
                      <Detail label="Date of Birth" value={formatDate(selectedCrew.dateOfBirth)} />
                      <Detail label="Age" value={selectedCrew.age} />
                      <Detail label="Nationality" value={selectedCrew.nationality} />
                      <Detail label="Gender" value={selectedCrew.gender} />
                      <Detail label="Civil Status" value={selectedCrew.civilStatus} />
                      <Detail label="Uniform Size" value={selectedCrew.uniformSize} />
                      <Detail label="Place of Birth" value={selectedCrew.placeOfBirth} />
                      <Detail label="Mobile" value={selectedCrew.mobileNumber} />
                      <Detail label="Email" value={selectedCrew.emailAddress} />
                      <Detail label="Address" value={selectedCrew.completeAddress} />
                      <Detail label="No. of Children" value={selectedCrew.numOfChildren} />
                      <Detail label="Religion" value={selectedCrew.religion} />
                      <Detail label="Vessel Type" value={selectedCrew.vesselType} />
                    </div>
                  </div>

                  {/* NEXT OF KIN */}
                  <div className="border border-[#E0E8F0] rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0080C0] mb-2">
                      Next of Kin
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail label="Name / Relationship" value={selectedCrew.nextOfKin} />
                      <Detail label="Address" value={selectedCrew.nextOfKinAddress} />
                    </div>
                  </div>

                  {/* EDUCATION */}
                  <div className="border border-[#E0E8F0] rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0080C0] mb-2">
                      Education
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Detail label="School Attended" value={selectedCrew.schoolAttended} />
                      <Detail label="Course" value={selectedCrew.course} />
                      <Detail label="Year Graduated" value={selectedCrew.yearGraduated} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Detail label="High School" value={`${selectedCrew.highSchool?.schoolName || ""} (${selectedCrew.highSchool?.yearGraduated || ""})`} />
                      <Detail label="College" value={`${selectedCrew.college?.schoolName || ""} (${selectedCrew.college?.course || ""} - ${selectedCrew.college?.yearGraduated || ""})`} />
                    </div>
                  </div>

                  {/* REMARKS */}
                  <div className="border border-[#E0E8F0] rounded-xl p-4 mb-4">
                    <h3 className="text-lg font-bold text-[#0080C0] mb-2">
                      Remarks
                    </h3>
                    <p className="text-sm text-[#002060]">
                      {selectedCrew.remarks || "No remarks"}
                    </p>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#E0E8F0] hover:bg-[#F4F6FA] transition"
                  >
                    Close
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 bg-[#F9FBFD] border border-[#E0E8F0]">
      <p className="text-xs font-semibold text-[#6B7B8A]">{label}</p>
      <p className="text-sm text-[#002060] mt-1">{value || "-"}</p>
    </div>
  );
}
