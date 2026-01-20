"use client";

import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { dataStore } from "@/app/lib/dataStore";
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

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const THEME_COLORS = {
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

type CrewStatus = "all" | "approved" | "pending" | "disapproved";

export default function AdminDashboard() {
  const { email } = useAuth();
  const allCrews = dataStore.getAllCrews();

  // REAL-TIME UPDATES (Polling)
  const [realtimeTrigger, setRealtimeTrigger] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeTrigger((prev) => prev + 1);
    }, 2000); // every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<CrewStatus>("all");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");

  // Sorting
  const [sortBy, setSortBy] = React.useState<"name" | "status" | "date">("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal
  const [selectedCrew, setSelectedCrew] = React.useState<any>(null);

  const filteredCrews = allCrews
    .filter((crew) => (statusFilter === "all" ? true : crew.status === statusFilter))
    .filter((crew) => {
      if (!startDate && !endDate) return true;

      const created = new Date(crew.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;

      return created >= start && created <= end;
    })
    .filter((crew) => {
      if (!searchQuery) return true;
      return crew.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName) * dir;
      if (sortBy === "status") return a.status.localeCompare(b.status) * dir;
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      );
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredCrews.length / ITEMS_PER_PAGE);
  const paginatedCrews = filteredCrews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const approvedCount = filteredCrews.filter((c) => c.status === "approved").length;
  const pendingCount = filteredCrews.filter((c) => c.status === "proposed").length;
  const disapprovedCount = filteredCrews.filter((c) => c.status === "disapproved").length;

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
  ];

  const COLORS = [THEME_COLORS.blue, THEME_COLORS.amber, THEME_COLORS.red];

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
      headStyles: { fillColor: THEME_COLORS.purple },
    });

    doc.save("crew_report.pdf");
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-[#ffffff]">
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-[#ffffff] border-b border-[#374151]">
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
            <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border border-[#374151] mb-8">
              <h2 className="text-black font-bold mb-4">Filters</h2>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-black /70 text-sm">Status</label>
                  <select
                    className="w-full mt-2 bg-[#ffffff] border border-[#374151] rounded-lg p-3 text-black"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="disapproved">Disapproved</option>
                  </select>
                </div>

                <div>
                  <label className="text-black/70 text-sm">Start Date</label>
                  <input
                    type="date"
                    className="w-full mt-2 bg-[#ffffff] border border-[#374151] rounded-lg p-3 text-black"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-black/70 text-sm">End Date</label>
                  <input
                    type="date"
                    className="w-full mt-2 bg-[#ffffff] border border-[#374151] rounded-lg p-3 text-black"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-black/70 text-sm">Search</label>
                  <div className="relative mt-2">
                    <Search className="absolute top-3 left-3 text-black/60" />
                    <input
                      className="w-full pl-10 bg-[#ffffff] border border-[#374151] rounded-lg p-3 text-black"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-black/70 text-sm">Actions</label>
                  <button
                    className="w-full bg-[#10B981] hover:bg-[#0f9b6f] text-black rounded-lg p-3 flex items-center justify-center gap-2"
                    onClick={exportPDF}
                  >
                    <Download className="w-4 h-4" />
                    Export to PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border-l-4 border-[#2563EB]">
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

              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border-l-4 border-[#F59E0B]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Pending</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{pendingCount}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-[#F59E0B] opacity-25" />
                </div>
              </div>

              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border-l-4 border-[#10B981]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Approved</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{approvedCount}</p>
                  </div>
                  <FileCheck className="w-12 h-12 text-[#10B981] opacity-25" />
                </div>
              </div>

              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border-l-4 border-[#EF4444]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black/70 text-sm font-semibold">Disapproved</p>
                    <p className="text-3xl font-extrabold text-black mt-2">{disapprovedCount}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-[#EF4444] opacity-25" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border border-[#374151]">
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

              <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border border-[#374151]">
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

            {/* Sortable Table */}
            <div className="bg-[#ffffff] rounded-lg shadow-md p-6 border border-[#374151]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-black font-bold">Recent Applications</h2>
                <span className="text-black/70 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-black/70 text-sm">
                      <th
                        className="pb-3 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSortBy("name");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Name <ArrowUpDown className="w-4 h-4" />
                      </th>
                      <th
                        className="pb-3 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSortBy("status");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Status <ArrowUpDown className="w-4 h-4" />
                      </th>
                      <th className="pb-3">Email</th>
                      <th
                        className="pb-3 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSortBy("date");
                          setSortDir(sortDir === "asc" ? "desc" : "asc");
                        }}
                      >
                        Date <ArrowUpDown className="w-4 h-4" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCrews.map((crew, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-[#374151] cursor-pointer hover:bg-[#1F2937]"
                        onClick={() => setSelectedCrew(crew)}
                      >
                        <td className="py-3 text-black">{crew.fullName}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              crew.status === "approved"
                                ? "bg-green-500/20 text-green-300"
                                : crew.status === "proposed"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {crew.status}
                          </span>
                        </td>
                        <td className="py-3 text-black">{crew.emailAddress}</td>
                        <td className="py-3 text-black/70">
                          {new Date(crew.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between mt-4">
                <button
                  className="px-4 py-2 bg-[#3B82F6] text-black rounded-lg"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="px-4 py-2 bg-[#8B5CF6] text-black rounded-lg"
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
            <div className="bg-[#111827] rounded-2xl shadow-xl w-11/12 md:w-3/4 p-6 border border-[#374151]">
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

              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-[#10B981] text-black rounded-lg"
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
