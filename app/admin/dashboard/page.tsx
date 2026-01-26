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

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { listenCrewApplications } from "@/app/lib/crewservice";

/* =======================
   TYPES
======================= */
type CrewStatus = "all" | "approved" | "proposed" | "disapproved" | "pooled" | "assigned";

/* =======================
   CONSTANTS
======================= */
const ITEMS_PER_PAGE = 10;

const THEME_COLORS = {
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  teal: "#14B8A6",
};

const COLORS = [
  THEME_COLORS.blue,
  THEME_COLORS.amber,
  THEME_COLORS.green,
  THEME_COLORS.red,
  THEME_COLORS.purple,
];

/* =======================
   DATE HELPERS
======================= */
const getTime = (value: any): number => {
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const formatDate = (value: any): string => {
  const time = getTime(value);
  if (!time) return "—";
  return new Date(time).toLocaleDateString();
};

/* =======================
   COMPONENT
======================= */
export default function AdminDashboard() {
  const { email } = useAuth();

  const [crews, setCrews] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<CrewStatus>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCrew, setSelectedCrew] = useState<any>(null);

  /* =======================
     FIRESTORE REALTIME
  ======================= */
  useEffect(() => {
    const unsubscribe = listenCrewApplications(setCrews);
    return () => unsubscribe();
  }, []);

  /* =======================
     FILTER + SORT
  ======================= */
  const filteredCrews = useMemo(() => {
    let list = [...crews];

    // Status
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;

      list = list.filter((c) => {
        const created = getTime(c.createdAt);
        return created >= start && created <= end;
      });
    }

    // Search
    if (searchQuery) {
      list = list.filter((c) =>
        c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName) * dir;
      if (sortBy === "status") return a.status.localeCompare(b.status) * dir;
      return (getTime(a.createdAt) - getTime(b.createdAt)) * dir;
    });

    return list;
  }, [crews, statusFilter, startDate, endDate, searchQuery, sortBy, sortDir]);

  /* =======================
   PAGINATION
======================= */
  const totalPages = Math.max(1, Math.ceil(filteredCrews.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, searchQuery]);

  const paginatedCrews = filteredCrews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* =======================
     COUNTS
  ======================= */
  const approvedCount = filteredCrews.filter((c) => c.status === "approved").length;
  const proposedCount = filteredCrews.filter((c) => c.status === "proposed").length;
  const disapprovedCount = filteredCrews.filter((c) => c.status === "disapproved").length;
  const pooledCount = filteredCrews.filter((c) => c.status === "pooled").length;
  const assignedCount = filteredCrews.filter((c) => c.status === "assigned").length;

  /* =======================
     CHART DATA (REAL-TIME)
  ======================= */
  const trendData = filteredCrews
    .map((c) => ({ date: formatDate(c.createdAt) }))
    .reduce((acc: any[], cur) => {
      const found = acc.find((a) => a.date === cur.date);
      if (found) found.total += 1;
      else acc.push({ date: cur.date, total: 1 });
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pieData = [
    { name: "Approved", value: approvedCount },
    { name: "Proposed", value: proposedCount },
    { name: "Active", value: assignedCount },
    { name: "Disapproved", value: disapprovedCount },
    { name: "Pooled", value: pooledCount },
  ];

  /* =======================
     PDF EXPORT
  ======================= */
  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.text("Crew Applications Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Name", "Status", "Email", "Date"]],
      body: filteredCrews.map((c) => [
        c.fullName,
        c.status,
        c.emailAddress,
        formatDate(c.createdAt),
      ]),
    });

    doc.save("crew_report.pdf");
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-[#f7f7ff]">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 lg:ml-64 bg-white border-b z-20">
            <div className="flex justify-between px-6 py-4">
              <h1 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" /> Admin Dashboard
              </h1>
              <span className="text-sm text-gray-600">
                Logged in as <b>{email}</b>
              </span>
            </div>
          </div>

          <div className="pt-24 px-6 pb-10">
            {/* FILTERS */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border mb-8">
              <h2 className="font-bold mb-4">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  className="border rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CrewStatus)}
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="proposed">Proposed</option>
                  <option value="assigned">Active</option>
                  <option value="disapproved">Disapproved</option>
                  <option value="pooled">Pooled</option>
                </select>

                <input type="date" className="border rounded-xl p-3" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" className="border rounded-xl p-3" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" />
                  <input
                    className="pl-10 border rounded-xl p-3 w-full"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button
                  onClick={exportPDF}
                  className="bg-green-500 text-black rounded-xl p-3 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: "Total Crew", value: filteredCrews.length, status: "all", icon: Users, color: "text-blue-600" },
                { label: "Proposed", value: proposedCount, status: "proposed", icon: TrendingUp, color: "text-amber-500" },
                { label: "Approved", value: approvedCount, status: "approved", icon: FileCheck, color: "text-green-500" },

                { label: "Active", value: assignedCount, status: "assigned", icon: Activity, color: "text-green-500" },
                { label: "Disapproved", value: disapprovedCount, status: "disapproved", icon: XCircle, color: "text-red-500" },
                { label: "Pooled", value: pooledCount, status: "pooled", icon: Activity, color: "text-purple-500" },
              ].map((s) => {
                const isActive = statusFilter === s.status || (s.status === "all" && statusFilter === "all");
                return (
                  <button
                    key={s.label}
                    onClick={() => setStatusFilter(s.status as CrewStatus)}
                    className={`bg-white rounded-2xl shadow-sm p-6 border transition hover:shadow-md ${
                      isActive ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500 font-semibold">{s.label}</p>
                        <p className="text-3xl font-extrabold mt-2">{s.value}</p>
                      </div>
                      <s.icon className={`w-12 h-12 opacity-25 ${s.color}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border">
                <h2 className="font-bold mb-4">Application Trend</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke={THEME_COLORS.blue} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border">
                <h2 className="font-bold mb-4">Status Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RECENT APPLICATIONS TABLE */}
            <div className="bg-white rounded-2xl shadow-md p-6 border">
              <div className="flex justify-between mb-4">
                <h2 className="font-semibold text-lg">Recent Applications</h2>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <table className="w-full">
                <thead className="text-gray-500 text-sm">
                  <tr>
                    <th className="text-left px-4 pb-3">Name</th>
                    <th className="text-left px-4 pb-3">Status</th>
                    <th className="text-left px-4 pb-3">Email</th>
                    <th className="text-left px-4 pb-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCrews.map((c, i) => (
                    <tr
                      key={i}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedCrew(c)}
                    >
                      <td className="px-4 py-4 font-medium">{c.fullName}</td>
                      <td className="px-4 py-4">{c.status}</td>
                      <td className="px-4 py-4">{c.emailAddress}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-gray-100 rounded-xl"
                >
                  Previous
                </button>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
