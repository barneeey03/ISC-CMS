"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { useAuth } from "@/app/context/AuthContext";

import {
  Users,
  FileCheck,
  XCircle,
  TrendingUp,
  Search,
  Download,
  Bell,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  approved: { color: "#22C55E", bg: "#22C55E22" },
  pending: { color: "#F59E0B", bg: "#F59E0B22" },
  disapproved: { color: "#EF4444", bg: "#EF444422" },
  fooled: { color: "#8B5CF6", bg: "#8B5CF622" },
  proposed: { color: "#0EA5E9", bg: "#0EA5E922" },
  assigned: { color: "#10B981", bg: "#10B98122" },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLE[status] ?? { color: "#64748B", bg: "#CBD5E122" };

const createUID = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

export default function SuperAdminDashboard() {
  const { email } = useAuth();

  const [crews, setCrews] = useState<any[]>([]);
  const prevCrewsRef = useRef<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  // Fetch crew applications
  useEffect(() => {
    const crewRef = collection(db, "crewApplications");

    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...(doc.data() as any), id: doc.id });
      });

      const prev = prevCrewsRef.current;

      const newItems = list.filter((x) => !prev.some((p) => p.id === x.id));
      const statusChanged = list.filter((x) => {
        const old = prev.find((p) => p.id === x.id);
        return old && old.status !== x.status;
      });

      if (newItems.length > 0) {
        const newNotifs = newItems.map((item) => ({
          uid: createUID(),
          appId: item.id,
          message: `📌 New application received: ${item.fullName}`,
          time: new Date().toLocaleTimeString(),
          read: false,
        }));

        setNotifications((prev) => [...newNotifs, ...prev]);
      }

      if (statusChanged.length > 0) {
        const statusNotifs = statusChanged.map((item) => ({
          uid: createUID(),
          appId: item.id,
          message: `🔄 Status updated: ${item.fullName} is now ${item.status}`,
          time: new Date().toLocaleTimeString(),
          read: false,
        }));

        setNotifications((prev) => [...statusNotifs, ...prev]);
      }

      prevCrewsRef.current = list;
      setCrews(list);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = (uid: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.uid === uid ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const [statusFilter, setStatusFilter] =
    useState<"all" | "approved" | "pending" | "disapproved" | "fooled" | "proposed" | "assigned">("all");

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [sortKey, setSortKey] = useState<"createdAt" | "fullName" | "presentRank" | "vesselType" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredCrews = useMemo(() => {
    return crews.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      const createdAtRaw = c.createdAt?.toDate?.() ?? c.createdAt;
      const created = new Date(createdAtRaw).getTime();

      if (fromDate && created < new Date(fromDate).getTime()) return false;
      if (toDate && created > new Date(toDate).getTime()) return false;

      if (
        search &&
        !`${c.fullName} ${c.presentRank} ${c.vesselType}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [crews, statusFilter, search, fromDate, toDate]);

  const sortedCrews = useMemo(() => {
    return [...filteredCrews].sort((a: any, b: any) => {
      const A = a[sortKey];
      const B = b[sortKey];

      if (sortKey === "createdAt") {
        const dateA = new Date(A?.toDate?.() ?? A).getTime();
        const dateB = new Date(B?.toDate?.() ?? B).getTime();
        return sortDir === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCrews, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedCrews.length / pageSize);
  const paginatedCrews = sortedCrews.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const total = filteredCrews.length;
  const approved = filteredCrews.filter((c) => c.status === "approved").length;
  const disapproved = filteredCrews.filter((c) => c.status === "disapproved").length;
  const fooled = filteredCrews.filter((c) => c.status === "fooled").length;
  const proposed = filteredCrews.filter((c) => c.status === "proposed").length;
  const assigned = filteredCrews.filter((c) => c.status === "assigned").length;

  const monthlyData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = months.map((m) => ({ month: m, value: 0 }));

    filteredCrews.forEach((c) => {
      const createdAtRaw = c.createdAt?.toDate?.() ?? c.createdAt;
      if (!createdAtRaw) return;
      const monthIndex = new Date(createdAtRaw).getMonth();
      if (isNaN(monthIndex)) return;
      data[monthIndex].value++;
    });

    return data;
  }, [filteredCrews]);

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
      head: [["Name", "Rank", "Vessel Type", "Status", "Date"]],
      body: sortedCrews.map((c) => [
        c.fullName,
        c.presentRank,
        c.vesselType,
        c.status.toUpperCase(),
        new Date(c.createdAt?.toDate?.() ?? c.createdAt).toLocaleDateString(),
      ]),
    });

    doc.save("applicants-report.pdf");
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="min-h-screen flex bg-linear-to-br from-blue-50 via-white to-purple-50">
        <SuperAdminSidebar />

        <main className="flex-1 ml-65 p-6 space-y-5">
          {/* HEADER */}
          <div className="flex justify-between items-center gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Dashboard
              </h1>
              <p className="text-sm text-slate-600">
                Welcome back, <span className="font-medium">{email}</span>
              </p>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 rounded-full bg-white border shadow-sm hover:bg-blue-50 transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 rounded-full bg-red-500 text-white text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b font-bold flex justify-between items-center">
                    <span>Notifications</span>
                    <div className="flex gap-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-3 text-sm text-slate-600">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n: any, idx: number) => (
                        <div
                          key={`${n.uid}-${idx}`}
                          onClick={() => markAsRead(n.uid)}
                          className={`p-3 border-b hover:bg-blue-50 cursor-pointer ${
                            n.read ? "bg-white" : "bg-blue-50"
                          }`}
                        >
                          <div className="text-sm">{n.message}</div>
                          <div className="text-xs text-slate-400">{n.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded border bg-white text-sm shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
              <option value="fooled">Fooled</option>
              <option value="proposed">Proposed</option>
              <option value="assigned">Active Crews</option>
            </select>

            <input
              type="date"
              className="h-10 px-3 rounded border bg-white text-sm shadow-sm"
              onChange={(e) => setFromDate(e.target.value)}
            />

            <input
              type="date"
              className="h-10 px-3 rounded border bg-white text-sm shadow-sm"
              onChange={(e) => setToDate(e.target.value)}
            />

            <div className="relative md:col-span-2 flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Search crew..."
                  className="h-10 pl-9 pr-3 w-full rounded border bg-white text-sm shadow-sm"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                onClick={exportPDF}
                className="ml-3 h-10 flex items-center gap-2 px-4 rounded border bg-linear-to-r from-red-600 to-red-600 text-white text-sm hover:from-red-700 hover:to-red-700 transition"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard title="Total Crew" value={total} icon={<Users />} />
            <StatCard title="Proposed" value={proposed} icon={<TrendingUp />} />
            <StatCard title="Approved" value={approved} icon={<FileCheck />} />
            <StatCard title="Disapproved" value={disapproved} icon={<XCircle />} />
            <StatCard title="Fooled" value={fooled} icon={<XCircle />} />
            <StatCard title="Active Crews" value={assigned} icon={<Users />} />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly Applications">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3B82F6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Status Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: approved },
                      { name: "Proposed", value: proposed },
                      { name: "Disapproved", value: disapproved },
                      { name: "Fooled", value: fooled },
                      { name: "Active Crews", value: assigned }
                    ]}
                    dataKey="value"
                    outerRadius={90}
                    animationDuration={500}
                    label
                  >
                    <Cell fill="#22C55E" />
                    <Cell fill="#0EA5E9" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#8B5CF6" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl border p-4 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-900">All Applicants</h2>

            <table className="w-full text-sm">
              <thead className="bg-blue-50">
                <tr>
                  {["fullName","presentRank","vesselType","status","createdAt"].map(k => (
                    <th
                      key={k}
                      onClick={() => {
                        setSortKey(k as any);
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      }}
                      className="p-2 cursor-pointer text-left text-slate-700"
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
                    <tr key={c.id} className="border-b hover:bg-blue-50">
                      <td className="p-2">{c.fullName}</td>
                      <td className="p-2">{c.presentRank}</td>
                      <td className="p-2">{c.vesselType}</td>
                      <td className="p-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {c.status === "assigned" ? "ACTIVE" : c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2">
                        {new Date(c.createdAt?.toDate?.() ?? c.createdAt).toLocaleDateString()}
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
                className="px-3 py-1 border rounded bg-white hover:bg-blue-50 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded bg-white hover:bg-blue-50 disabled:opacity-50"
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

function StatCard({ title, value, icon }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border rounded-xl p-4 flex justify-between shadow-sm"
    >
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="opacity-70">{icon}</div>
    </motion.div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <h3 className="font-bold mb-2 text-slate-900">{title}</h3>
      {children}
    </div>
  );
}