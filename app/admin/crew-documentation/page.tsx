"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";

import { CrewMember } from "@/app/lib/type";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/* ================================
   TYPES
================================ */
interface DocumentRow {
  crewName: string;
  document: string;
  documentNo: string;
  expiry: string | null;
  daysLeft: number | null;
  status: "valid" | "expiring" | "expired";
}

/* ================================
   MAIN COMPONENT
================================ */
export default function CrewDocumentations() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState("");
  const [docFilter, setDocFilter] = useState("all");
  const [expiredOnly, setExpiredOnly] = useState(false);

  /* ================================
     FIRESTORE – LIVE SYNC
  ================================ */
  useEffect(() => {
    const ref = collection(db, "crewApplications");
    return onSnapshot(ref, (snap) => {
      setCrews(snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })));
    });
  }, []);

  /* ================================
     BUILD ROWS
  ================================ */
  const rows = useMemo<DocumentRow[]>(() => {
    const today = new Date();

    return crews.flatMap((crew) =>
      crew.documents.map((doc) => {
        const expiryDate = new Date(doc.expiryDate);
        const daysLeft = Math.ceil(
          (expiryDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        let status: DocumentRow["status"] = "valid";
        if (daysLeft < 0) status = "expired";
        else if (daysLeft <= 30) status = "expiring";

        return {
          crewName: crew.fullName,
          document: doc.name,
          documentNo: doc.placeIssued || "—",
          expiry: doc.expiryDate,
          daysLeft,
          status,
        };
      })
    );
  }, [crews]);

  /* ================================
     FILTERS
  ================================ */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (
        search &&
        !r.crewName.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (docFilter !== "all" && r.document !== docFilter) return false;

      if (expiredOnly && r.status !== "expired") return false;

      return true;
    });
  }, [rows, search, docFilter, expiredOnly]);

  /* ================================
     GROUP BY CREW (NO NAME REPEAT)
  ================================ */
  const groupedRows = useMemo(() => {
    return filteredRows.reduce<Record<string, DocumentRow[]>>(
      (acc, row) => {
        acc[row.crewName] = acc[row.crewName] || [];
        acc[row.crewName].push(row);
        return acc;
      },
      {}
    );
  }, [filteredRows]);

  /* ================================
     SUMMARY
  ================================ */
  const summary = useMemo(() => {
    return {
      valid: rows.filter((r) => r.status === "valid").length,
      expiring: rows.filter((r) => r.status === "expiring").length,
      expired: rows.filter((r) => r.status === "expired").length,
    };
  }, [rows]);

  /* ================================
     HELPERS
  ================================ */
  const formatDate = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const statusBadge = (row: DocumentRow) => {
    if (row.status === "expired")
      return (
        <span className="flex justify-center items-center gap-1 text-red-600 font-semibold">
          <XCircle size={14} /> Expired
        </span>
      );
    if (row.status === "expiring")
      return (
        <span className="flex justify-center items-center gap-1 text-orange-500 font-semibold">
          <AlertTriangle size={14} /> {row.daysLeft} days
        </span>
      );
    return (
      <span className="flex justify-center items-center gap-1 text-green-600">
        <CheckCircle size={14} /> Valid
      </span>
    );
  };

  /* ================================
     RENDER
  ================================ */
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-[#F5F9FC]">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b p-6">
            <h1 className="text-3xl font-extrabold text-[#002060]">
              Crew Documentations
            </h1>
            <p className="text-[#6B87A6] mt-1">
              Professional document monitoring module
            </p>
          </div>

          <div className="pt-28 px-6 pb-10">
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <SummaryCard label="Valid Documents" value={summary.valid} />
              <SummaryCard
                label="Expiring (≤30 days)"
                value={summary.expiring}
              />
              <SummaryCard label="Expired Documents" value={summary.expired} />
            </div>

            {/* SEARCH + FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 flex-1">
                <Search size={16} />
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Search crew name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="border px-3 py-2 rounded-lg"
                value={docFilter}
                onChange={(e) => setDocFilter(e.target.value)}
              >
                <option value="all">All Documents</option>
                {[...new Set(rows.map((r) => r.document))].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={expiredOnly}
                  onChange={(e) => setExpiredOnly(e.target.checked)}
                />
                Expired only
              </label>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm text-center">
                <thead className="bg-[#002060] text-white">
                  <tr>
                    <th className="px-6 py-3">Crew Name</th>
                    <th className="px-6 py-3">Document</th>
                    <th className="px-6 py-3">Document No.</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedRows).map(
                    ([crewName, docs]) =>
                      docs.map((r, i) => (
                        <tr
                          key={`${crewName}-${i}`}
                          className={`border-b ${
                            r.status === "expired"
                              ? "bg-red-50"
                              : r.status === "expiring"
                              ? "bg-orange-50"
                              : ""
                          }`}
                        >
                          {i === 0 && (
                            <td
                              rowSpan={docs.length}
                              className="px-6 py-3 font-bold align-middle"
                            >
                              {crewName}
                            </td>
                          )}
                          <td className="px-6 py-3">{r.document}</td>
                          <td className="px-6 py-3">{r.documentNo}</td>
                          <td className="px-6 py-3">
                            {formatDate(r.expiry)}
                          </td>
                          <td className="px-6 py-3">{statusBadge(r)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ================================
   SUMMARY CARD
================================ */
function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="p-6 rounded-xl bg-white shadow border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-extrabold text-[#002060]">{value}</p>
    </div>
  );
}
