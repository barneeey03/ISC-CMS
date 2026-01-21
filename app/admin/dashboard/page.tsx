"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import {
  Users,
  FileCheck,
  XCircle,
  TrendingUp,
  Activity,
  Download,
  Search,
  ArrowUpDown,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const THEME_COLORS = {
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

const COLORS = [
  THEME_COLORS.blue,
  THEME_COLORS.amber,
  THEME_COLORS.red,
  THEME_COLORS.purple,
];

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { listenCrewApplications, updateCrewInFirestore } from "@/app/lib/crewservice";

type CrewStatus = "all" | "approved" | "pending" | "disapproved" | "fooled";

export default function AdminDashboard() {
  const { email } = useAuth();

  const [crews, setCrews] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<CrewStatus>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [selectedCrew, setSelectedCrew] = useState<any>(null);

  // 🔥 REALTIME FIRESTORE SYNC
  useEffect(() => {
    const unsubscribe = listenCrewApplications((data: any[]) => {
      setCrews(data);
    });
    return () => unsubscribe();
  }, []);

  // Filter + Sort + Pagination
  const filteredCrews = useMemo(() => {
    let list = crews;

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        list = list.filter(
          (c) => c.status === "proposed" || c.status === "pending"
        );
      } else {
        list = list.filter((c) => c.status === statusFilter);
      }
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      list = list.filter((c) => {
        const created = new Date(c.createdAt).getTime();
        return created >= start && created <= end;
      });
    }

    if (searchQuery) {
      list = list.filter((c) =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    list = list.sort((a: any, b: any) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName) * dir;
      if (sortBy === "status") return a.status.localeCompare(b.status) * dir;
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
        dir
      );
    });

    return list;
  }, [crews, statusFilter, startDate, endDate, searchQuery, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredCrews.length / ITEMS_PER_PAGE);
  const paginatedCrews = filteredCrews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const approvedCount = filteredCrews.filter((c) => c.status === "approved").length;
  const pendingCount = filteredCrews.filter(
    (c) => c.status === "proposed" || c.status === "pending"
  ).length;
  const disapprovedCount = filteredCrews.filter((c) => c.status === "disapproved").length;
  const fooledCount = filteredCrews.filter((c) => c.status === "fooled").length;

  // Chart Data
  const trendData = filteredCrews
    .map((crew) => ({ date: new Date(crew.createdAt).toLocaleDateString() }))
    .reduce((acc, cur) => {
      const found = acc.find((a) => a.date === cur.date);
      if (found) found.total++;
      else acc.push({ date: cur.date, total: 1 });
      return acc;
    }, [] as { date: string; total: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pieData = [
    { name: "Approved", value: approvedCount },
    { name: "Pending", value: pendingCount },
    { name: "Disapproved", value: disapprovedCount },
    { name: "Fooled", value: fooledCount },
  ];

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Crew Applications Report", 14, 20);

    const tableData = filteredCrews.map((crew) => [
      crew.fullName,
      crew.status,
      crew.emailAddress,
      new Date(crew.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      head: [["Name", "Status", "Email", "Date"]],
      body: tableData,
      startY: 30,
      theme: "grid",
    });

    doc.save("crew_report.pdf");
  };

  const updateStatus = async (crewId: string, status: any) => {
    await updateCrewInFirestore(crewId, { status });
    setSelectedCrew(null);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-[#f7f7ff]">
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-black/80" />
                <h1 className="text-black font-bold text-lg">Admin Dashboard</h1>
              </div>
              <div className="text-black/70 text-sm">
                Logged in as: <span className="text-black">{email}</span>
              </div>
            </div>
          </div>

          <div className="pt-20 px-6 pb-10">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb] mb-8">
              <h2 className="text-black font-bold mb-4">Filters</h2>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-black/70 text-sm">Status</label>
                  <select
                    className="w-full mt-2 bg-white border border-[#e5e7eb] rounded-xl p-3 text-black"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="disapproved">Disapproved</option>
                    <option value="fooled">Fooled</option>
                  </select>
                </div>

                <div>
                  <label className="text-black/70 text-sm">Start Date</label>
                  <input
                    type="date"
                    className="w-full mt-2 bg-white border border-[#e5e7eb] rounded-xl p-3 text-black"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-black/70 text-sm">End Date</label>
                  <input
                    type="date"
                    className="w-full mt-2 bg-white border border-[#e5e7eb] rounded-xl p-3 text-black"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-black/70 text-sm">Search</label>
                  <div className="relative mt-2">
                    <Search className="absolute top-3 left-3 text-black/60" />
                    <input
                      className="w-full pl-10 bg-white border border-[#e5e7eb] rounded-xl p-3 text-black"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-black/70 text-sm">Actions</label>
                  <button
                    className="w-full bg-[#10B981] hover:bg-[#0f9b6f] text-black rounded-xl p-3 flex items-center justify-center gap-2"
                    onClick={exportPDF}
                  >
                    <Download className="w-4 h-4" />
                    Export to PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Total Crew</p>
                    <p className="text-3xl font-extrabold text-black mt-2">
                      {filteredCrews.length}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-[#2563EB] opacity-25" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Pending</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{pendingCount}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-[#F59E0B] opacity-25" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Approved</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{approvedCount}</p>
                  </div>
                  <FileCheck className="w-12 h-12 text-[#10B981] opacity-25" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Disapproved</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{disapprovedCount}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-[#EF4444] opacity-25" />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Fooled</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{fooledCount}</p>
                  </div>
                  <Activity className="w-12 h-12 text-[#8B5CF6] opacity-25" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <h2 className="text-black font-bold mb-4">Application Trend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "none" }} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke={THEME_COLORS.blue}
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#e5e7eb]">
                <h2 className="text-black font-bold mb-4">Status Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          {/* Recent Applications Table */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gray-900 font-semibold text-lg">Recent Applications</h2>
              <span className="text-gray-500 text-sm">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-sm">
                    <th className="pb-3 pl-4 pr-6 text-left">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setSortBy("name");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Name <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>

                    <th className="pb-3 pl-4 pr-6 text-left">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setSortBy("status");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Status <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>

                    <th className="pb-3 pl-4 pr-6 text-left">Email</th>

                    <th className="pb-3 pl-4 pr-6 text-left">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setSortBy("date");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Date <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCrews.map((crew, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedCrew(crew)}
                    >
                      <td className="py-4 pl-4 pr-6 text-gray-900 font-medium">
                        {crew.fullName}
                      </td>

                      <td className="py-4 pl-4 pr-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                            crew.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : crew.status === "proposed" || crew.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : crew.status === "disapproved"
                              ? "bg-red-100 text-red-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {crew.status}
                        </span>
                      </td>

                      <td className="py-4 pl-4 pr-6 text-gray-700">
                        {crew.emailAddress}
                      </td>

                      <td className="py-4 pl-4 pr-6 text-gray-500">
                        {new Date(crew.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-5">
              <button
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <button
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* Modal */}
        {selectedCrew && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl w-11/12 md:w-3/4 p-6 border border-[#e5e7eb]">
              <div className="flex justify-between items-center">
                <h2 className="text-black font-bold text-lg">Crew Details</h2>
                <button
                  className="text-black/70 hover:text-black"
                  onClick={() => setSelectedCrew(null)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-black/70">Full Name</p>
                  <p className="text-black font-semibold">{selectedCrew.fullName}</p>
                </div>
                <div>
                  <p className="text-black/70">Email</p>
                  <p className="text-black font-semibold">{selectedCrew.emailAddress}</p>
                </div>
                <div>
                  <p className="text-black/70">Status</p>
                  <p className="text-black font-semibold">{selectedCrew.status}</p>
                </div>
                <div>
                  <p className="text-black/70">Created At</p>
                  <p className="text-black font-semibold">
                    {new Date(selectedCrew.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-black/70">Address</p>
                <p className="text-black font-semibold">{selectedCrew.completeAddress}</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="px-4 py-2 bg-[#F59E0B] text-black rounded-xl"
                  onClick={() => updateStatus(selectedCrew.id, "proposed")}
                >
                  Proposed
                </button>
                <button
                  className="px-4 py-2 bg-[#10B981] text-black rounded-xl"
                  onClick={() => updateStatus(selectedCrew.id, "approved")}
                >
                  Approved
                </button>
                <button
                  className="px-4 py-2 bg-[#EF4444] text-black rounded-xl"
                  onClick={() => updateStatus(selectedCrew.id, "disapproved")}
                >
                  Disapproved
                </button>
                <button
                  className="px-4 py-2 bg-[#8B5CF6] text-black rounded-xl"
                  onClick={() => updateStatus(selectedCrew.id, "fooled")}
                >
                  Fooled
                </button>
              </div>

              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-[#111827] text-white rounded-xl"
                  onClick={() => setSelectedCrew(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
