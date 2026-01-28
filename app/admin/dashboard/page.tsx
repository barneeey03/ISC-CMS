"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import {
  XCircle,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Filter,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  PauseCircle,
  Users,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { listenCrewApplications } from "@/app/lib/crewservice";
import * as XLSX from "xlsx";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AdminSidebar } from "@/app/components/AdminSidebar";

/* =======================
   TYPES
======================= */
type CrewStatus = "all" | "passed" | "failed" | "pending" | "on-hold";

/* =======================
   CONSTANTS
======================= */
const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
  passed: {
    label: "Passed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    chartColor: "#10B981",
  },
  failed: {
    label: "Failed",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    chartColor: "#EF4444",
  },
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    chartColor: "#F59E0B",
  },
  "on-hold": {
    label: "On Hold",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    chartColor: "#3B82F6",
  },
};

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
  return new Date(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value: any): string => {
  const time = getTime(value);
  if (!time) return "—";
  return new Date(time).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [showFilters, setShowFilters] = useState(false);

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
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, searchQuery]);

  const totalPages = Math.ceil(filteredCrews.length / ITEMS_PER_PAGE);
  const paginatedCrews = filteredCrews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* =======================
     COUNTS & STATS
  ======================= */
  const passedCount = filteredCrews.filter((c) => c.status === "passed").length;
  const failedCount = filteredCrews.filter((c) => c.status === "failed").length;
  const pendingCount = filteredCrews.filter((c) => c.status === "pending").length;
  const onHoldCount = filteredCrews.filter((c) => c.status === "on-hold").length;

  // Calculate success rate
  const totalProcessed = passedCount + failedCount;
  const successRate =
    totalProcessed > 0 ? ((passedCount / totalProcessed) * 100).toFixed(1) : "0.0";

  // Get last 7 days for trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  /* =======================
     CHART DATA
  ======================= */
  // Weekly trend with all statuses
  const weeklyTrendData = last7Days.map((date) => {
    const dayStart = new Date();
    const index = last7Days.indexOf(date);
    dayStart.setDate(dayStart.getDate() - (6 - index));
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayCrews = filteredCrews.filter((c) => {
      const createdTime = getTime(c.createdAt);
      return createdTime >= dayStart.getTime() && createdTime <= dayEnd.getTime();
    });

    return {
      date,
      passed: dayCrews.filter((c) => c.status === "passed").length,
      failed: dayCrews.filter((c) => c.status === "failed").length,
      pending: dayCrews.filter((c) => c.status === "pending").length,
      "on-hold": dayCrews.filter((c) => c.status === "on-hold").length,
      total: dayCrews.length,
    };
  });

  // Status distribution pie
  const pieData = [
    { name: "Passed", value: passedCount, color: "#10B981" },
    { name: "Failed", value: failedCount, color: "#EF4444" },
    { name: "Pending", value: pendingCount, color: "#F59E0B" },
    { name: "On Hold", value: onHoldCount, color: "#3B82F6" },
  ].filter((item) => item.value > 0);

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        date: new Date(d.getFullYear(), d.getMonth(), 1),
      };
    });

    return months.map(({ month, date }) => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const count = filteredCrews.filter((c) => {
        const createdTime = getTime(c.createdAt);
        return (
          createdTime >= monthStart.getTime() && createdTime <= monthEnd.getTime()
        );
      }).length;

      return { month, count };
    });
  }, [filteredCrews]);

  // Processing time analysis (mock data - replace with actual processing time if available)
  const processingTimeData = [
    { status: "Passed", avgDays: 3.5 },
    { status: "Failed", avgDays: 2.8 },
    { status: "Pending", avgDays: 5.2 },
    { status: "On Hold", avgDays: 7.1 },
  ];

  /* =======================
     EXPORT FUNCTIONS
  ======================= */
  const exportPDF = () => {
    const doc = new jsPDF("landscape");

    // Title
    doc.setFontSize(18);
    doc.text("Crew Applications Dashboard Report", 14, 20);

    // Summary stats
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Applications: ${filteredCrews.length}`, 14, 37);
    doc.text(`Success Rate: ${successRate}%`, 14, 44);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [["Name", "Status", "Email", "Date Applied"]],
      body: filteredCrews.map((c) => [
        c.fullName,
        c.status.toUpperCase(),
        c.emailAddress,
        formatDate(c.createdAt),
      ]),
      headStyles: { fillColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    doc.save(`crew_dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportCSV = () => {
    const headers = ["Name", "Status", "Email", "Date Applied"];
    const rows = filteredCrews.map((c) => [
      c.fullName,
      c.status,
      c.emailAddress,
      formatDate(c.createdAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crew_dashboard_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Crew Applications Dashboard Report"],
      [],
      ["Generated:", new Date().toLocaleString()],
      ["Total Applications:", filteredCrews.length],
      ["Success Rate:", `${successRate}%`],
      [],
      ["Status Breakdown:"],
      ["Passed:", passedCount],
      ["Failed:", failedCount],
      ["Pending:", pendingCount],
      ["On Hold:", onHoldCount],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths for summary sheet
    summarySheet["!cols"] = [{ wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Applications Sheet
    const applicationsData = [
      [
        "Name",
        "Status",
        "Email",
        "Contact Number",
        "Position",
        "Address",
        "Date Applied",
        "Date/Time Applied",
      ],
      ...filteredCrews.map((c) => [
        c.fullName || "",
        c.status || "",
        c.emailAddress || "",
        c.contactNumber || "",
        c.position || "",
        c.address || "",
        formatDate(c.createdAt),
        formatDateTime(c.createdAt),
      ]),
    ];
    const applicationsSheet = XLSX.utils.aoa_to_sheet(applicationsData);

    // Set column widths for applications sheet
    applicationsSheet["!cols"] = [
      { wch: 25 }, // Name
      { wch: 12 }, // Status
      { wch: 30 }, // Email
      { wch: 15 }, // Contact
      { wch: 20 }, // Position
      { wch: 40 }, // Address
      { wch: 15 }, // Date
      { wch: 20 }, // DateTime
    ];

    XLSX.utils.book_append_sheet(wb, applicationsSheet, "Applications");

    // Status Statistics Sheet
    const statusStatsData = [
      ["Status", "Count", "Percentage"],
      [
        "Passed",
        passedCount,
        totalProcessed > 0
          ? `${((passedCount / filteredCrews.length) * 100).toFixed(1)}%`
          : "0%",
      ],
      [
        "Failed",
        failedCount,
        totalProcessed > 0
          ? `${((failedCount / filteredCrews.length) * 100).toFixed(1)}%`
          : "0%",
      ],
      [
        "Pending",
        pendingCount,
        `${((pendingCount / filteredCrews.length) * 100).toFixed(1)}%`,
      ],
      [
        "On Hold",
        onHoldCount,
        `${((onHoldCount / filteredCrews.length) * 100).toFixed(1)}%`,
      ],
      [],
      ["Total", filteredCrews.length, "100%"],
    ];
    const statusStatsSheet = XLSX.utils.aoa_to_sheet(statusStatsData);

    // Set column widths for status stats sheet
    statusStatsSheet["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, statusStatsSheet, "Status Statistics");

    // Weekly Trend Sheet
    const weeklyTrendSheetData = [
      ["Date", "Passed", "Failed", "Pending", "On Hold", "Total"],
      ...weeklyTrendData.map((d) => [
        d.date,
        d.passed,
        d.failed,
        d.pending,
        d["on-hold"],
        d.total,
      ]),
    ];
    const weeklyTrendSheet = XLSX.utils.aoa_to_sheet(weeklyTrendSheetData);

    // Set column widths for weekly trend sheet
    weeklyTrendSheet["!cols"] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, weeklyTrendSheet, "Weekly Trend");

    // Monthly Trend Sheet
    if (monthlyData.length > 0) {
      const monthlyTrendSheetData = [
        ["Month", "Applications"],
        ...monthlyData.map((d) => [d.month, d.count]),
      ];
      const monthlyTrendSheet = XLSX.utils.aoa_to_sheet(monthlyTrendSheetData);

      // Set column widths for monthly trend sheet
      monthlyTrendSheet["!cols"] = [{ wch: 15 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, monthlyTrendSheet, "Monthly Trend");
    }

    // Write the file
    XLSX.writeFile(
      wb,
      `crew_dashboard_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

        * {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            system-ui, sans-serif;
          letter-spacing: -0.01em;
        }
      `}</style>

      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />

        <div className="flex-1 lg:ml-64">
          {/* HEADER */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-300">
            <div className="px-8 py-5 flex justify-between items-center">
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Dashboard Overview
                </h1>
                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                  Monitor and manage crew applications
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-medium">{email}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw size={18} className="text-gray-600" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* FILTERS */}
            <div className="bg-white rounded border border-gray-300 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                  <Filter size={16} strokeWidth={2} />
                  Filters & Search
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showFilters ? "Hide" : "Show"} Advanced
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                    strokeWidth={2}
                  />
                  <input
                    className="pl-10 border border-gray-300 rounded p-2.5 w-full text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="border border-gray-300 rounded p-2.5 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CrewStatus)}
                >
                  <option value="all">All Statuses</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="on-hold">On Hold</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex-1 bg-blue-600 text-white rounded p-2.5 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} strokeWidth={2} /> PDF
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex-1 bg-emerald-600 text-white rounded p-2.5 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <FileText size={16} strokeWidth={2} /> CSV
                  </button>
                </div>

                <button
                  onClick={exportExcel}
                  className="bg-green-600 text-white rounded p-2.5 flex items-center justify-center gap-2 text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download size={16} strokeWidth={2} /> Excel
                </button>

                {showFilters && (
                  <>
                    <div className="md:col-span-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="border border-gray-300 rounded p-2.5 w-full text-sm"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                          End Date
                        </label>
                        <input
                          type="date"
                          className="border border-gray-300 rounded p-2.5 w-full text-sm"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="border border-gray-300 rounded p-2.5 w-full text-sm font-medium"
                        >
                          <option value="date">Date</option>
                          <option value="name">Name</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">
                          Order
                        </label>
                        <select
                          value={sortDir}
                          onChange={(e) => setSortDir(e.target.value as any)}
                          className="border border-gray-300 rounded p-2.5 w-full text-sm font-medium"
                        >
                          <option value="desc">Newest First</option>
                          <option value="asc">Oldest First</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <StatCard
                icon={<Users size={22} strokeWidth={2} />}
                label="Total Applications"
                value={filteredCrews.length}
                onClick={() => setStatusFilter("all")}
                active={statusFilter === "all"}
                trend={filteredCrews.length > 0 ? "+12%" : "0%"}
                trendUp={true}
              />
              <StatCard
                icon={<CheckCircle size={22} strokeWidth={2} />}
                label="Passed"
                value={passedCount}
                onClick={() => setStatusFilter("passed")}
                active={statusFilter === "passed"}
                color="emerald"
              />
              <StatCard
                icon={<XCircle size={22} strokeWidth={2} />}
                label="Failed"
                value={failedCount}
                onClick={() => setStatusFilter("failed")}
                active={statusFilter === "failed"}
                color="red"
              />
              <StatCard
                icon={<Clock size={22} strokeWidth={2} />}
                label="Pending"
                value={pendingCount}
                onClick={() => setStatusFilter("pending")}
                active={statusFilter === "pending"}
                color="amber"
              />
              <StatCard
                icon={<PauseCircle size={22} strokeWidth={2} />}
                label="On Hold"
                value={onHoldCount}
                onClick={() => setStatusFilter("on-hold")}
                active={statusFilter === "on-hold"}
                color="blue"
              />
            </div>

            {/* SUCCESS RATE BANNER */}
            <div className="bg-linear-to-r from-emerald-50 to-blue-50 rounded border border-emerald-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded border border-emerald-200">
                    <TrendingUp
                      className="text-emerald-700"
                      size={28}
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-700 uppercase">
                      Success Rate
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {successRate}%
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      {passedCount} passed out of {totalProcessed} processed
                      applications
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                    Quick Stats
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-medium">
                      <span className="font-bold text-emerald-700">
                        {passedCount}
                      </span>{" "}
                      Passed
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      <span className="font-bold text-red-700">{failedCount}</span>{" "}
                      Failed
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      <span className="font-bold text-amber-700">{pendingCount}</span>{" "}
                      Pending Review
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trend - Stacked Area */}
              <div className="bg-white rounded border border-gray-300 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase flex items-center gap-2">
                  <BarChart3 size={16} strokeWidth={2} />
                  7-Day Application Trend
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Area
                        type="monotone"
                        dataKey="passed"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stackId="1"
                        stroke="#F59E0B"
                        fill="#F59E0B"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="on-hold"
                        stackId="1"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="failed"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution - Pie */}
              <div className="bg-white rounded border border-gray-300 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase flex items-center gap-2">
                  <BarChart3 size={16} strokeWidth={2} />
                  Status Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Applications Bar Chart */}
              <div className="bg-white rounded border border-gray-300 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase flex items-center gap-2">
                  <Calendar size={16} strokeWidth={2} />
                  Monthly Applications (Last 6 Months)
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Processing Time */}
              <div className="bg-white rounded border border-gray-300 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase flex items-center gap-2">
                  <Clock size={16} strokeWidth={2} />
                  Avg. Processing Time (Days)
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processingTimeData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <YAxis
                        dataKey="status"
                        type="category"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="avgDays"
                        fill="#8B5CF6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RECENT APPLICATIONS TABLE */}
            <div className="bg-white rounded border border-gray-300 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900 uppercase">
                  Recent Applications
                </h2>
                <span className="text-xs text-gray-600 font-medium">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredCrews.length)} of{" "}
                  {filteredCrews.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase">
                        Name
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase">
                        Email
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase">
                        Date Applied
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {paginatedCrews.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <AlertCircle
                              className="text-gray-400"
                              size={32}
                              strokeWidth={2}
                            />
                            <p className="text-gray-600 font-semibold text-sm">
                              No applications found
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedCrews.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-sm text-gray-900">
                            {c.fullName}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">
                            {c.emailAddress}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 font-medium">
                            {formatDate(c.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => setSelectedCrew(c)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREW DETAIL MODAL */}
      {selectedCrew && (
        <CrewDetailModal crew={selectedCrew} onClose={() => setSelectedCrew(null)} />
      )}
    </ProtectedRoute>
  );
}

/* =======================
   STAT CARD COMPONENT
======================= */
function StatCard({
  icon,
  label,
  value,
  onClick,
  active = false,
  color = "gray",
  trend,
  trendUp,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  onClick?: () => void;
  active?: boolean;
  color?: "gray" | "emerald" | "red" | "amber" | "blue";
  trend?: string;
  trendUp?: boolean;
}) {
  const colors = {
    gray: "text-gray-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    amber: "text-amber-700",
    blue: "text-blue-700",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white border-2 rounded p-5 transition-all text-left hover:shadow-md ${
        active ? "border-blue-500 shadow-md" : "border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`p-2 bg-gray-50 rounded border border-gray-200 ${colors[color]}`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold ${
              trendUp ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {trendUp ? (
              <TrendingUp size={12} strokeWidth={2} />
            ) : (
              <TrendingDown size={12} strokeWidth={2} />
            )}
            {trend}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-gray-600 uppercase mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </button>
  );
}

/* =======================
   STATUS BADGE
======================= */
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status,
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.bg} ${config.color} border ${config.border} rounded text-xs font-semibold uppercase`}
    >
      {config.label}
    </span>
  );
}

/* =======================
   CREW DETAIL MODAL
======================= */
function CrewDetailModal({ crew, onClose }: { crew: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded border border-gray-300 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{crew.fullName}</h2>
            <p className="text-gray-300 mt-0.5 text-sm font-medium">
              Application Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <XCircle className="text-white" size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                Status
              </p>
              <StatusBadge status={crew.status} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                Date Applied
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {formatDateTime(crew.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">Email</p>
              <p className="text-sm text-gray-900 font-medium">
                {crew.emailAddress}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                Contact
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {crew.contactNumber || "—"}
              </p>
            </div>
          </div>

          {crew.position && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                Position
              </p>
              <p className="text-sm text-gray-900 font-medium">{crew.position}</p>
            </div>
          )}

          {crew.address && (
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase mb-1">
                Address
              </p>
              <p className="text-sm text-gray-900 font-medium">{crew.address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}