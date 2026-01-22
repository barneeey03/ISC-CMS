"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { useAuth } from "@/app/context/AuthContext";
import { dataStore } from "@/app/lib/dataStore";

import {
  Users,
  FileCheck,
  XCircle,
  TrendingUp,
  Search,
  Download,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------- STATUS COLOR MAP ---------------- */

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  approved: { color: "#10B981", bg: "#10B98122" },
  pending: { color: "#F59E0B", bg: "#F59E0B22" },
  disapproved: { color: "#EF4444", bg: "#EF444422" },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLE[status] ?? { color: "#64748B", bg: "#CBD5E122" };

/* ---------------- COMPONENT ---------------- */

export default function SuperAdminDashboard() {
  const { email } = useAuth();
  const crews = dataStore.getAllCrews();

  /* ---------- FILTER STATE ---------- */
  const [statusFilter, setStatusFilter] =
    useState<"all" | "approved" | "pending" | "disapproved">("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------- SORT & PAGINATION ---------- */
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  /* ---------- FILTER LOGIC ---------- */
  const filteredCrews = useMemo(() => {
    return crews.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      const created = new Date(c.createdAt).getTime();
      if (fromDate && created < new Date(fromDate).getTime()) return false;
      if (toDate && created > new Date(toDate).getTime()) return false;

      if (
        search &&
        !`${c.name} ${c.rank} ${c.vesselName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [crews, statusFilter, search, fromDate, toDate]);

  /* ---------- SORT ---------- */
  const sortedCrews = useMemo(() => {
    return [...filteredCrews].sort((a: any, b: any) => {
      const A = a[sortKey];
      const B = b[sortKey];
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCrews, sortKey, sortDir]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(sortedCrews.length / pageSize);
  const paginatedCrews = sortedCrews.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ---------- COUNTS ---------- */
  const total = filteredCrews.length;
  const pending = filteredCrews.filter((c) => c.status === "pending").length;
  const approved = filteredCrews.filter((c) => c.status === "approved").length;
  const disapproved = filteredCrews.filter(
    (c) => c.status === "disapproved"
  ).length;

  /* ---------- CHART DATA ---------- */
  const monthlyData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = months.map((m) => ({ month: m, value: 0 }));
    filteredCrews.forEach((c) => {
      data[new Date(c.createdAt).getMonth()].value++;
    });
    return data;
  }, [filteredCrews]);

  /* ---------- EXPORT PDF ---------- */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Applicants Report", 14, 14);

    doc.setFontSize(10);
    doc.text(
      `Status: ${statusFilter} | ${fromDate || "Any"} → ${toDate || "Any"}`,
      14,
      22
    );

    autoTable(doc, {
      startY: 28,
      head: [["Name", "Rank", "Vessel", "Status", "Date"]],
      body: sortedCrews.map((c) => [
        c.name,
        c.rank,
        c.vesselName,
        c.status.toUpperCase(),
        new Date(c.createdAt).toLocaleDateString(),
      ]),
    });

    doc.save("applicants-report.pdf");
  };

  /* ================= RENDER ================= */

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="min-h-screen flex bg-background">
        <SuperAdminSidebar />

        <main className="flex-1 ml-65 p-4 md:p-6 space-y-4">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl font-extrabold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {email}
            </p>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-2 rounded border bg-card"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
            </select>

            <input type="date" className="p-2 border rounded" onChange={e => setFromDate(e.target.value)} />
            <input type="date" className="p-2 border rounded" onChange={e => setToDate(e.target.value)} />

            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search crew..."
                className="pl-9 p-2 w-full border rounded"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="Total Crew" value={total} icon={<Users />} />
            <StatCard title="Pending" value={pending} icon={<TrendingUp />} />
            <StatCard title="Approved" value={approved} icon={<FileCheck />} />
            <StatCard title="Disapproved" value={disapproved} icon={<XCircle />} />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly Applications">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: approved },
                      { name: "Pending", value: pending },
                      { name: "Disapproved", value: disapproved },
                    ]}
                    dataKey="value"
                    outerRadius={90}
                    animationDuration={500}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* TABLE */}
          <div className="bg-card rounded-xl border p-4 space-y-3">
            <div className="flex justify-between">
              <h2 className="font-bold">All Applicants</h2>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-3 py-1 border rounded"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {["name","rank","vesselName","status","createdAt"].map(k => (
                    <th
                      key={k}
                      onClick={() => {
                        setSortKey(k);
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      }}
                      className="p-2 cursor-pointer text-left"
                    >
                      {k.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedCrews.map((c) => {
                  const s = getStatusStyle(c.status);
                  return (
                    <tr key={c.id} className="border-b">
                      <td className="p-2">{c.name}</td>
                      <td className="p-2">{c.rank}</td>
                      <td className="p-2">{c.vesselName}</td>
                      <td className="p-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="flex justify-between items-center">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>
              <span className="text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function StatCard({ title, value, icon }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-xl p-3 flex justify-between"
    >
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="opacity-60">{icon}</div>
    </motion.div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <h3 className="font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
}
