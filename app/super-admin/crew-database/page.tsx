"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { Search, Download, ArrowUpDown, FileText } from "lucide-react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

type CrewType = any;

export default function CrewDatabase() {
  const [crews, setCrews] = useState<CrewType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterVessel, setFilterVessel] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "approved" | "pending" | "disapproved" | "proposed" | "fooled" | "active"
  >("all");

  const [sortKey, setSortKey] = useState<keyof CrewType>("fullName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [selectedCrew, setSelectedCrew] = useState<CrewType | null>(null);
  const [itemsToShow, setItemsToShow] = useState(10);

  useEffect(() => {
    const crewRef = collection(db, "crewApplications");
    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const list: CrewType[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...(doc.data() as any), id: doc.id });
      });
      setCrews(list);
    });
    return () => unsubscribe();
  }, []);

  const filteredCrews = useMemo(() => {
    const filtered = crews.filter((crew) => {
      const matchesSearch =
        crew.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crew.emailAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesName =
        crew.fullName.toLowerCase().includes(filterName.toLowerCase());
      const matchesRank =
        crew.presentRank.toLowerCase().includes(filterRank.toLowerCase());
      const matchesVessel =
        (crew.vesselType || "n/a")
          .toLowerCase()
          .includes(filterVessel.toLowerCase());

      const status = crew.status === "assigned" ? "active" : crew.status;

      const matchesStatus =
        filterStatus === "all" ? true : status === filterStatus;

      return matchesSearch && matchesName && matchesRank && matchesVessel && matchesStatus;
    });

    const sorted = filtered.sort((a, b) => {
      const A = (a[sortKey] ?? "").toString();
      const B = (b[sortKey] ?? "").toString();

      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    crews,
    searchTerm,
    filterName,
    filterRank,
    filterVessel,
    filterStatus,
    sortKey,
    sortDir,
  ]);

  const visibleCrews = filteredCrews.slice(0, itemsToShow);

  const loadMore = () => setItemsToShow((prev) => prev + 10);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSort = (key: keyof CrewType) => {
    setSortKey(key);
    setSortDir(sortDir === "asc" ? "desc" : "asc");
  };

  // Export to Excel
  const exportExcel = () => {
    const data = filteredCrews.map((c) => {
      const status = c.status === "assigned" ? "active" : c.status;
      return {
        Name: c.fullName,
        Rank: c.presentRank,
        Vessel: c.vesselType || "N/A",
        Age: c.age || "—",
        Email: c.emailAddress,
        Status: status.toUpperCase(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Crew Database");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, "crew_database.xlsx");
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Crew Database", 14, 22);

    const headers = [["Name", "Rank", "Vessel", "Age", "Email", "Status"]];

    const rows = filteredCrews.map((c) => {
      const status = c.status === "assigned" ? "active" : c.status;
      return [
        c.fullName,
        c.presentRank,
        c.vesselType || "N/A",
        c.age || "—",
        c.emailAddress,
        status.toUpperCase(),
      ];
    });

    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [10, 165, 233] },
    });

    doc.save("crew_database.pdf");
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen bg-[#F5F9FC]">
        <SuperAdminSidebar />

        <div className="flex-1 ml-64">
          {/* Header */}
          <div className="bg-white border-b border-[#E0E8F0] p-6">
            <div>
              <h1 className="text-2xl font-extrabold text-[#002060]">
                Crew Database
              </h1>
              <p className="text-sm text-[#80A0C0] mt-1">
                Professional compact view with filters & infinite scroll
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-end mt-4 px-6 gap-3">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-5 py-2 bg-[#005B96] text-white rounded-lg shadow-sm hover:bg-blue-800 transition"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>

            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#006c22] text-white text-sm hover:bg-[#039d00] transition"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#80A0C0]" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] text-sm"
                    placeholder="Search email or name"
                  />
                </div>

                <input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] text-sm"
                  placeholder="Filter by Name"
                />

                <input
                  value={filterRank}
                  onChange={(e) => setFilterRank(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] text-sm"
                  placeholder="Filter by Rank"
                />

                <input
                  value={filterVessel}
                  onChange={(e) => setFilterVessel(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] text-sm"
                  placeholder="Filter by Vessel"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-3 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="proposed">Proposed</option>
                  <option value="disapproved">Disapproved</option>
                  <option value="fooled">Fooled</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-5">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F1F7FB]">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-[#002060] font-semibold cursor-pointer"
                      onClick={() => toggleSort("fullName")}
                    >
                      Name <ArrowUpDown className="inline-block ml-1 w-4 h-4" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[#002060] font-semibold cursor-pointer"
                      onClick={() => toggleSort("presentRank")}
                    >
                      Rank <ArrowUpDown className="inline-block ml-1 w-4 h-4" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[#002060] font-semibold cursor-pointer"
                      onClick={() => toggleSort("vesselType")}
                    >
                      Vessel <ArrowUpDown className="inline-block ml-1 w-4 h-4" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[#002060] font-semibold cursor-pointer"
                      onClick={() => toggleSort("age")}
                    >
                      Age <ArrowUpDown className="inline-block ml-1 w-4 h-4" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[#002060] font-semibold cursor-pointer"
                      onClick={() => toggleSort("emailAddress")}
                    >
                      Email <ArrowUpDown className="inline-block ml-1 w-4 h-4" />
                    </th>
                    <th className="px-4 py-3 text-left text-[#002060] font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleCrews.map((crew) => {
                    const status = crew.status === "assigned" ? "active" : crew.status;

                    return (
                      <tr
                        key={crew.id}
                        className="border-b hover:bg-[#F3F6F9] cursor-pointer"
                        onClick={() => setSelectedCrew(crew)}
                      >
                        <td className="px-4 py-3 text-[#002060]">
                          {crew.fullName}
                        </td>
                        <td className="px-4 py-3 text-[#002060]">
                          {crew.presentRank}
                        </td>
                        <td className="px-4 py-3 text-[#002060]">
                          {crew.vesselType || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-[#002060]">
                          {crew.age || "—"}
                        </td>
                        <td className="px-4 py-3 text-[#002060]">
                          {crew.emailAddress}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              status === "approved"
                                ? "bg-[#22C55E] text-white"
                                : status === "pending"
                                  ? "bg-[#F59E0B] text-white"
                                  : status === "proposed"
                                    ? "bg-[#8B5CF6] text-white"
                                    : status === "active"
                                      ? "bg-[#22C55E] text-white" // ACTIVE green
                                      : status === "fooled"
                                        ? "bg-[#0EA5E9] text-white"
                                        : "bg-[#EF4444] text-white"
                            }`}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* View Modal */}
            {selectedCrew && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl w-11/12 md:w-2/3 p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-xl text-[#002060]">
                      Crew Details
                    </h2>
                    <button
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                      onClick={() => setSelectedCrew(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#80A0C0]">Full Name</p>
                      <p className="font-bold text-[#002060]">
                        {selectedCrew.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#80A0C0]">Rank</p>
                      <p className="font-bold text-[#002060]">
                        {selectedCrew.presentRank}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#80A0C0]">Vessel Type</p>
                      <p className="font-bold text-[#002060]">
                        {selectedCrew.vesselType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#80A0C0]">Age</p>
                      <p className="font-bold text-[#002060]">
                        {selectedCrew.age || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#80A0C0]">Email</p>
                      <p className="font-bold text-[#002060]">
                        {selectedCrew.emailAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#80A0C0]">Status</p>
                      <p className="font-bold text-[#002060]">
                        {(selectedCrew.status === "assigned"
                          ? "ACTIVE"
                          : selectedCrew.status.toUpperCase())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
