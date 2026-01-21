"use client";

import { useEffect, useMemo, useState } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { dataStore } from "@/app/lib/dataStore";

import {
  Users,
  FileCheck,
  XCircle,
  TrendingUp,
  AlertCircle,
  Ship,
  Search,
  RefreshCcw,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";


export default function SuperAdminDashboard() {
  const { email } = useAuth();

  const [crews, setCrews] = useState(dataStore.getAllCrews());

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "disapproved">("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [search, setSearch] = useState("");

  // Real-time update simulation (auto-refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      setCrews(dataStore.getAllCrews());
    }, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredCrews = useMemo(() => {
    return crews.filter((crew) => {
      // Status filter
      if (statusFilter !== "all" && crew.status !== statusFilter) return false;

      // Date filter
      const createdAt = new Date(crew.createdAt).getTime();
      if (fromDate && createdAt < new Date(fromDate).getTime()) return false;
      if (toDate && createdAt > new Date(toDate).getTime()) return false;

      // Search filter
      const keyword = search.toLowerCase();
      if (
        !crew.name.toLowerCase().includes(keyword) &&
        !crew.rank.toLowerCase().includes(keyword) &&
        !crew.vesselName.toLowerCase().includes(keyword)
      ) return false;

      return true;
    });
  }, [crews, statusFilter, fromDate, toDate, search]);

  const approvedCount = filteredCrews.filter((c) => c.status === "approved").length;
  const pendingCount = filteredCrews.filter((c) => c.status === "pending").length;
  const disapprovedCount = filteredCrews.filter((c) => c.status === "disapproved").length;

  const COLORS = [
    "var(--theme-blue)",
    "var(--theme-amber)",
    "var(--theme-red)",
    "var(--theme-purple)",
  ];

  // Monthly trend
  const lineData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const data = months.map((m) => ({ month: m, value: 0 }));

    filteredCrews.forEach((crew) => {
      const idx = new Date(crew.createdAt).getMonth();
      data[idx].value += 1;
    });

    return data;
  }, [filteredCrews]);

  // Top Vessels
  const vesselStats = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCrews.forEach((crew) => {
      const vessel = crew.vesselName || "Unknown";
      map[vessel] = (map[vessel] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredCrews]);

  // Expiring certificates (fake data for demo)
  const expiring = useMemo(() => {
    return filteredCrews
      .filter((c) => c.certificates?.some((cert) => new Date(cert.validUntil) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)))
      .slice(0, 5);
  }, [filteredCrews]);

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="min-h-screen flex dashboard-bg">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full z-20">
          <SuperAdminSidebar />
        </div>

        {/* Main */}
        <div className="dashboard-main w-full">
          <div className="bg-[var(--card)] border-b border-[var(--border)] p-6">
            <h1 className="text-3xl font-extrabold text-[var(--foreground)]">
              Dashboard
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Welcome back, {email}
            </p>
          </div>

          {/* Filters + Search */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="disapproved">Disapproved</option>
            </select>

            <input
              type="date"
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <input
              type="date"
              className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

            <div className="relative">
              <input
                type="text"
                className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                placeholder="Search by name, rank, vessel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute right-3 top-3 w-5 h-5 text-[var(--muted-foreground)]" />
            </div>
          </div>

          {/* Stats Cards (Aligned) */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Crew" value={filteredCrews.length} color="var(--theme-blue)" icon={<Users className="w-10 h-10" />} />
            <StatCard title="Pending" value={pendingCount} color="var(--theme-amber)" icon={<TrendingUp className="w-10 h-10" />} />
            <StatCard title="Approved" value={approvedCount} color="var(--theme-purple)" icon={<FileCheck className="w-10 h-10" />} />
            <StatCard title="Disapproved" value={disapprovedCount} color="var(--theme-red)" icon={<XCircle className="w-10 h-10" />} />
          </div>

          {/* Analytics Charts */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend */}
            <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Monthly Applications
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="var(--theme-blue)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Pie */}
            <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: approvedCount },
                      { name: "Pending", value: pendingCount },
                      { name: "Disapproved", value: disapprovedCount },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {COLORS.slice(0, 3).map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Vessels */}
            <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Top Vessels
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vesselStats}>
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--theme-amber)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Activity + Expiring */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  Live Activity Feed
                </h2>
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5 text-[var(--muted-foreground)]" />
                  <span className="text-xs text-[var(--muted-foreground)]">Auto-updates every 3s</span>
                </div>
              </div>
              <div className="space-y-3">
                {filteredCrews.slice(0, 5).map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="flex justify-between">
                      <span className="font-bold text-[var(--foreground)]">{c.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{c.status}</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {c.rank} • {c.vesselName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Certificates Expiring Soon
              </h2>
              <div className="space-y-3">
                {expiring.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="font-bold text-[var(--foreground)]">{c.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Expiring soon • {c.certificates[0]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}


function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm p-6 border border-[var(--border)] hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--muted-foreground)] text-sm font-semibold">{title}</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
          <div style={{ color: color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
