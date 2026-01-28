"use client";

import React, { JSX, Key, useEffect, useMemo, useState, Fragment } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download,
  Filter,
  FileText,
  Award,
  Heart,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2
} from "lucide-react";
import { CrewMember } from "@/app/lib/type";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/* ================================
   TYPES
================================ */
type StatusType = "valid" | "expiring" | "expired";
type StatusFilterType = "all" | StatusType | "expiredOnly";

interface DocumentRow { 
  crewName: string; 
  crewId: string;
  documents: string; 
  documentNos: string; 
  expiries: string; 
  status: StatusType; 
}

interface CertificateRow { 
  crewName: string; 
  crewId: string;
  certificates: string; 
  documentNos: string; 
  placeIssued: string; 
  trainingCenters: string; 
  expiries: string; 
  status: StatusType; 
}

interface MedicalRow { 
  crewName: string; 
  crewId: string;
  medicalTypes: string; 
  issuingClinics: string; 
  expiries: string; 
  status: StatusType; 
}

interface Stats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
}

/* ================================
   MAIN COMPONENT
================================ */
export default function CrewDocumentations() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<"documents" | "certificates" | "medical">("documents");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const today = new Date();

  /* ================================
     FETCH CREWS
  ================================ */
  useEffect(() => {
    const ref = collection(db, "crewApplications");
    return onSnapshot(ref, snap => {
      setCrews(snap.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    });
  }, []);

  /* ================================
     HELPER FUNCTIONS
  ================================ */
  const getStatus = (expiryDates: (string | number | Date | null)[]): StatusType => {
    let status: StatusType = "valid";
    for (const d of expiryDates) {
      if (!d) continue;
      const diff = Math.ceil((new Date(d).getTime() - today.getTime()) / (1000*60*60*24));
      if (diff < 0) return "expired";
      if (diff <= 30) status = "expiring";
    }
    return status;
  };

  const formatDate = (dates: (string | number | Date | null)[]) =>
    dates.map(d => d ? new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}) : "—").join(", ");

  const formatExpiryDate = (expiry: string | number | Date | null) =>
    expiry ? new Date(expiry).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}) : "—";

  const getDaysUntilExpiry = (expiry: string | number | Date | null): number => {
    if (!expiry) return 999999;
    return Math.ceil((new Date(expiry).getTime() - today.getTime()) / (1000*60*60*24));
  };

  /* ================================
     STATISTICS
  ================================ */
  const calculateStats = (rows: any[]): Stats => {
    return {
      total: rows.length,
      valid: rows.filter(r => r.status === "valid").length,
      expiring: rows.filter(r => r.status === "expiring").length,
      expired: rows.filter(r => r.status === "expired").length,
    };
  };

  /* ================================
     BUILD ROWS
  ================================ */
  const documentRows = useMemo<DocumentRow[]>(() => crews.map(crew => {
    const docs = crew.documents || [];
    return {
      crewName: crew.fullName,
      crewId: crew.id || crew.fullName,
      documents: docs.map(d => d.name || "—").join(", "),
      documentNos: docs.map(d => d.placeIssued || "—").join(", "),
      expiries: formatDate(docs.map(d => d.expiryDate ?? null)),
      status: getStatus(docs.map(d => d.expiryDate ?? null)),
    };
  }), [crews]);

  const certificateRows = useMemo<CertificateRow[]>(() => crews.map(crew => {
    const certs = crew.certificates || [];
    return {
      crewName: crew.fullName,
      crewId: crew.id || crew.fullName,
      certificates: certs.map(c => c.name).join(", ") || "—",
      documentNos: certs.map(c => c.documentNo || c.number || c.referenceNo || "—").join(", "),
      placeIssued: certs.map(c => c.placeIssued || "—").join(", "),
      trainingCenters: certs.map(c => c.trainingCenter || "—").join(", "),
      expiries: formatDate(certs.map(c => c.expiryDate || null)),
      status: getStatus(certs.map(c => c.expiryDate || null))
    };
  }), [crews]);

  const medicalRows = useMemo<MedicalRow[]>(() => crews.map(crew => {
    const meds = crew.medicals || [];
    return {
      crewName: crew.fullName,
      crewId: crew.id || crew.fullName,
      medicalTypes: meds.map((m: any) => m.name || m.type || m.medicalType || m.certificateType || "—").join(", "),
      issuingClinics: meds.map((m: any) => m.issuingClinic || "—").join(", "),
      expiries: formatDate(meds.map((m: any) => m.expiryDate || null)),
      status: getStatus(meds.map((m: any) => m.expiryDate || null))
    };
  }), [crews]);

  /* ================================
     FILTERING & SORTING
  ================================ */
  const filterAndSortRows = <T extends { crewName: string; status: StatusType; expiries: string }>(rows: T[]): T[] => {
    let filtered = rows.filter(r => {
      const matchesSearch = r.crewName.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "expiredOnly") return r.status === "expired";
      return r.status === statusFilter;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.crewName.localeCompare(b.crewName);
      } else if (sortBy === "status") {
        const statusOrder = { expired: 0, expiring: 1, valid: 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else if (sortBy === "expiry") {
        const aDate = a.expiries.split(", ")[0];
        const bDate = b.expiries.split(", ")[0];
        comparison = new Date(aDate || 0).getTime() - new Date(bDate || 0).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredDocuments = filterAndSortRows(documentRows);
  const filteredCertificates = filterAndSortRows(certificateRows);
  const filteredMedicals = filterAndSortRows(medicalRows);

  const currentStats = useMemo(() => {
    if (selectedSection === "documents") return calculateStats(filteredDocuments);
    if (selectedSection === "certificates") return calculateStats(filteredCertificates);
    return calculateStats(filteredMedicals);
  }, [selectedSection, filteredDocuments, filteredCertificates, filteredMedicals]);

  /* ================================
     EXPORT FUNCTIONALITY
  ================================ */
  const exportToCSV = () => {
    let data: any[] = [];
    let headers: string[] = [];

    if (selectedSection === "documents") {
      headers = ["Crew Name", "Documents", "Document Numbers", "Expiry Dates", "Status"];
      data = filteredDocuments.map(r => [r.crewName, r.documents, r.documentNos, r.expiries, r.status]);
    } else if (selectedSection === "certificates") {
      headers = ["Crew Name", "Certificates", "Document Numbers", "Place Issued", "Training Center", "Expiry Dates", "Status"];
      data = filteredCertificates.map(r => [r.crewName, r.certificates, r.documentNos, r.placeIssued, r.trainingCenters, r.expiries, r.status]);
    } else {
      headers = ["Crew Name", "Medical Types", "Issuing Clinics", "Expiry Dates", "Status"];
      data = filteredMedicals.map(r => [r.crewName, r.medicalTypes, r.issuingClinics, r.expiries, r.status]);
    }

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.map((cell: any) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crew-${selectedSection}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================================
     STATUS BADGE
  ================================ */
  const statusBadge = (status: StatusType) => {
    if (status === "expired") 
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded font-semibold text-xs">
          <XCircle size={14} strokeWidth={2}/> EXPIRED
        </span>
      );
    if (status === "expiring") 
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded font-semibold text-xs">
          <AlertTriangle size={14} strokeWidth={2}/> EXPIRING
        </span>
      );
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-xs">
        <CheckCircle size={14} strokeWidth={2}/> VALID
      </span>
    );
  };

  /* ================================
     TOGGLE ROW EXPANSION
  ================================ */
  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* ================================
     RENDER
  ================================ */
  return (
    <ProtectedRoute requiredRole="admin">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          letter-spacing: -0.01em;
        }
      `}</style>
      
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">

          {/* HEADER */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-300">
            <div className="px-8 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{letterSpacing: '-0.02em'}}>
                    Crew Documentation Management
                  </h1>
                  <p className="text-gray-600 text-sm font-medium">
                    Track and manage crew certifications, documents, and medical records
                  </p>
                </div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download size={16} strokeWidth={2} />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">

            {/* STATISTICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                icon={<Users className="text-blue-700" size={22} strokeWidth={2} />}
                label="Total Members"
                value={currentStats.total}
                bgColor="bg-white"
              />
              <StatCard
                icon={<CheckCircle className="text-emerald-700" size={22} strokeWidth={2} />}
                label="Valid"
                value={currentStats.valid}
                bgColor="bg-white"
              />
              <StatCard
                icon={<AlertTriangle className="text-amber-700" size={22} strokeWidth={2} />}
                label="Expiring"
                value={currentStats.expiring}
                bgColor="bg-white"
              />
              <StatCard
                icon={<XCircle className="text-red-700" size={22} strokeWidth={2} />}
                label="Expired"
                value={currentStats.expired}
                bgColor="bg-white"
              />
            </div>

            {/* FILTERS & CONTROLS */}
            <div className="bg-white rounded border border-gray-300 p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Search crew members..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium text-gray-900"
                    />
                  </div>
                </div>

                {/* Section Selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSection("documents")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded font-semibold transition-all text-sm ${
                      selectedSection === "documents"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FileText size={16} strokeWidth={2} />
                    Documents
                  </button>
                  <button
                    onClick={() => setSelectedSection("certificates")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded font-semibold transition-all text-sm ${
                      selectedSection === "certificates"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Award size={16} strokeWidth={2} />
                    Certificates
                  </button>
                  <button
                    onClick={() => setSelectedSection("medical")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded font-semibold transition-all text-sm ${
                      selectedSection === "medical"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Heart size={16} strokeWidth={2} />
                    Medical
                  </button>
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50 transition-all font-semibold text-gray-700 text-sm"
                >
                  <Filter size={16} strokeWidth={2} />
                  Filters
                  {showFilters ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="valid">Valid Only</option>
                      <option value="expiring">Expiring Soon</option>
                      <option value="expired">Expired Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 text-sm"
                    >
                      <option value="name">Name</option>
                      <option value="expiry">Expiry Date</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">
                      Sort Order
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-gray-900 text-sm"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* TABLES */}
            {selectedSection === "documents" && (
              <DocumentsTable 
                rows={filteredDocuments}
                crews={crews}
                expandedRows={expandedRows}
                toggleRowExpansion={toggleRowExpansion}
                setSelectedCrew={setSelectedCrew}
                today={today}
                getDaysUntilExpiry={getDaysUntilExpiry}
                formatExpiryDate={formatExpiryDate}
                statusBadge={statusBadge}
                getStatus={getStatus}
              />
            )}

            {selectedSection === "certificates" && (
              <CertificatesTable 
                rows={filteredCertificates}
                crews={crews}
                expandedRows={expandedRows}
                toggleRowExpansion={toggleRowExpansion}
                setSelectedCrew={setSelectedCrew}
                today={today}
                getDaysUntilExpiry={getDaysUntilExpiry}
                formatExpiryDate={formatExpiryDate}
                statusBadge={statusBadge}
                getStatus={getStatus}
              />
            )}

            {selectedSection === "medical" && (
              <MedicalsTable 
                rows={filteredMedicals}
                crews={crews}
                expandedRows={expandedRows}
                toggleRowExpansion={toggleRowExpansion}
                setSelectedCrew={setSelectedCrew}
                today={today}
                getDaysUntilExpiry={getDaysUntilExpiry}
                formatExpiryDate={formatExpiryDate}
                statusBadge={statusBadge}
                getStatus={getStatus}
              />
            )}

          </div>
        </div>

        {/* CREW DETAIL MODAL */}
        {selectedCrew && (
          <CrewDetailModal crew={selectedCrew} onClose={() => setSelectedCrew(null)} />
        )}
      </div>
    </ProtectedRoute>
  );
}

/* ================================
   STAT CARD COMPONENT
================================ */
function StatCard({ 
  icon, 
  label, 
  value, 
  bgColor
}: { 
  icon: JSX.Element; 
  label: string; 
  value: number; 
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} border border-gray-300 rounded p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-600 mb-2 uppercase">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ================================
   DOCUMENTS TABLE
================================ */
function DocumentsTable({ 
  rows, 
  crews, 
  expandedRows, 
  toggleRowExpansion, 
  setSelectedCrew, 
  today, 
  getDaysUntilExpiry, 
  formatExpiryDate, 
  statusBadge, 
  getStatus 
}: any) {
  return (
    <div className="bg-white rounded border border-gray-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              {["Crew Member", "Document Name", "Reference Number", "Expiry Date", "Status"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-bold uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded border border-gray-200">
                      <FileText className="text-gray-400" size={28} strokeWidth={2} />
                    </div>
                    <p className="text-gray-600 font-semibold text-sm">No documents found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r: DocumentRow) => {
                const crew = crews.find((c: CrewMember) => c.fullName === r.crewName);
                const docs = crew?.documents || [];
                const isExpanded = expandedRows.has(`doc-${r.crewId}`);
                
                if (docs.length === 0) {
                  return (
                    <tr key={`doc-${r.crewId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{r.crewName}</td>
                      <td className="px-5 py-3 text-gray-500 italic text-sm" colSpan={4}>No documents on file</td>
                    </tr>
                  );
                }

                const firstDoc = docs[0];
                const hasMultiple = docs.length > 1;
                const rowKey = `doc-${r.crewId}`;

                return (
                  <Fragment key={rowKey}>
                    <tr 
                      className={`transition-colors ${
                        new Date(firstDoc.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(firstDoc.expiryDate) <= 30 ? "bg-amber-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCrew(crew)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {r.crewName}
                          </button>
                          {hasMultiple && (
                            <button
                              onClick={() => toggleRowExpansion(rowKey)}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-0.5"
                            >
                              {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                            </button>
                          )}
                        </div>
                        {hasMultiple && (
                          <span className="text-xs text-gray-500 mt-0.5 block font-medium">
                            {docs.length} total
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{firstDoc.name || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 font-mono">
                        {firstDoc.placeIssued || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatExpiryDate(firstDoc.expiryDate)}
                          </span>
                          {firstDoc.expiryDate && (
                            <span className="text-xs text-gray-600 font-medium">
                              {getDaysUntilExpiry(firstDoc.expiryDate) > 0 
                                ? `${getDaysUntilExpiry(firstDoc.expiryDate)} days left`
                                : `${Math.abs(getDaysUntilExpiry(firstDoc.expiryDate))} days overdue`
                              }
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {statusBadge(getStatus([firstDoc.expiryDate]))}
                      </td>
                    </tr>
                    {isExpanded && docs.slice(1).map((d: any, idx: number) => (
                      <tr key={`${rowKey}-sub-${idx}`} className={`${
                        new Date(d.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(d.expiryDate) <= 30 ? "bg-amber-50" : "bg-gray-50"
                      }`}>
                        <td className="px-5 py-3 pl-10 text-sm text-gray-500 font-medium">↳ Additional</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{d.name || "—"}</td>
                        <td className="px-5 py-3 text-sm text-gray-700 font-mono">
                          {d.placeIssued || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatExpiryDate(d.expiryDate)}
                            </span>
                            {d.expiryDate && (
                              <span className="text-xs text-gray-600 font-medium">
                                {getDaysUntilExpiry(d.expiryDate) > 0 
                                  ? `${getDaysUntilExpiry(d.expiryDate)} days left`
                                  : `${Math.abs(getDaysUntilExpiry(d.expiryDate))} days overdue`
                                }
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {statusBadge(getStatus([d.expiryDate]))}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================
   CERTIFICATES TABLE
================================ */
function CertificatesTable({ 
  rows, 
  crews, 
  expandedRows, 
  toggleRowExpansion, 
  setSelectedCrew, 
  today, 
  getDaysUntilExpiry, 
  formatExpiryDate, 
  statusBadge, 
  getStatus 
}: any) {
  return (
    <div className="bg-white rounded border border-gray-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              {["Crew Member", "Certificate Name", "Reference Number", "Place Issued", "Training Center", "Expiry Date", "Status"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-bold uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded border border-gray-200">
                      <Award className="text-gray-400" size={28} strokeWidth={2} />
                    </div>
                    <p className="text-gray-600 font-semibold text-sm">No certificates found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r: CertificateRow) => {
                const crew = crews.find((c: CrewMember) => c.fullName === r.crewName);
                const certs = crew?.certificates || [];
                const isExpanded = expandedRows.has(`cert-${r.crewId}`);
                
                if (certs.length === 0) {
                  return (
                    <tr key={`cert-${r.crewId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{r.crewName}</td>
                      <td className="px-5 py-3 text-gray-500 italic text-sm" colSpan={6}>No certificates on file</td>
                    </tr>
                  );
                }

                const firstCert = certs[0];
                const hasMultiple = certs.length > 1;
                const rowKey = `cert-${r.crewId}`;

                return (
                  <Fragment key={rowKey}>
                    <tr 
                      className={`transition-colors ${
                        new Date(firstCert.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(firstCert.expiryDate) <= 30 ? "bg-amber-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCrew(crew)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {r.crewName}
                          </button>
                          {hasMultiple && (
                            <button
                              onClick={() => toggleRowExpansion(rowKey)}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-0.5"
                            >
                              {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                            </button>
                          )}
                        </div>
                        {hasMultiple && (
                          <span className="text-xs text-gray-500 mt-0.5 block font-medium">
                            {certs.length} total
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{firstCert.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 font-mono">
                        {firstCert.documentNo || firstCert.number || firstCert.referenceNo || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{firstCert.placeIssued || "—"}</td>
                      <td className="px-5 py-3 text-sm text-gray-700">{firstCert.trainingCenter || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatExpiryDate(firstCert.expiryDate)}
                          </span>
                          {firstCert.expiryDate && (
                            <span className="text-xs text-gray-600 font-medium">
                              {getDaysUntilExpiry(firstCert.expiryDate) > 0 
                                ? `${getDaysUntilExpiry(firstCert.expiryDate)} days left`
                                : `${Math.abs(getDaysUntilExpiry(firstCert.expiryDate))} days overdue`
                              }
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {statusBadge(getStatus([firstCert.expiryDate]))}
                      </td>
                    </tr>
                    {isExpanded && certs.slice(1).map((c: any, idx: number) => (
                      <tr key={`${rowKey}-sub-${idx}`} className={`${
                        new Date(c.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(c.expiryDate) <= 30 ? "bg-amber-50" : "bg-gray-50"
                      }`}>
                        <td className="px-5 py-3 pl-10 text-sm text-gray-500 font-medium">↳ Additional</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">{c.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-700 font-mono">
                          {c.documentNo || c.number || c.referenceNo || "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{c.placeIssued || "—"}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{c.trainingCenter || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatExpiryDate(c.expiryDate)}
                            </span>
                            {c.expiryDate && (
                              <span className="text-xs text-gray-600 font-medium">
                                {getDaysUntilExpiry(c.expiryDate) > 0 
                                  ? `${getDaysUntilExpiry(c.expiryDate)} days left`
                                  : `${Math.abs(getDaysUntilExpiry(c.expiryDate))} days overdue`
                                }
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {statusBadge(getStatus([c.expiryDate]))}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================
   MEDICALS TABLE
================================ */
function MedicalsTable({ 
  rows, 
  crews, 
  expandedRows, 
  toggleRowExpansion, 
  setSelectedCrew, 
  today, 
  getDaysUntilExpiry, 
  formatExpiryDate, 
  statusBadge, 
  getStatus 
}: any) {
  return (
    <div className="bg-white rounded border border-gray-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              {["Crew Member", "Medical Type", "Issuing Clinic", "Expiry Date", "Status"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-bold uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded border border-gray-200">
                      <Heart className="text-gray-400" size={28} strokeWidth={2} />
                    </div>
                    <p className="text-gray-600 font-semibold text-sm">No medical records found matching your criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r: MedicalRow) => {
                const crew = crews.find((c: CrewMember) => c.fullName === r.crewName);
                const meds = crew?.medicals || [];
                const isExpanded = expandedRows.has(`med-${r.crewId}`);
                
                if (meds.length === 0) {
                  return (
                    <tr key={`med-${r.crewId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{r.crewName}</td>
                      <td className="px-5 py-3 text-gray-500 italic text-sm" colSpan={4}>No medical records on file</td>
                    </tr>
                  );
                }

                const firstMed = meds[0];
                const hasMultiple = meds.length > 1;
                const rowKey = `med-${r.crewId}`;

                return (
                  <Fragment key={rowKey}>
                    <tr 
                      className={`transition-colors ${
                        new Date(firstMed.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(firstMed.expiryDate) <= 30 ? "bg-amber-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedCrew(crew)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {r.crewName}
                          </button>
                          {hasMultiple && (
                            <button
                              onClick={() => toggleRowExpansion(rowKey)}
                              className="text-gray-600 hover:text-gray-900 transition-colors p-0.5"
                            >
                              {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                            </button>
                          )}
                        </div>
                        {hasMultiple && (
                          <span className="text-xs text-gray-500 mt-0.5 block font-medium">
                            {meds.length} total
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">
                        {firstMed.name || firstMed.type || firstMed.medicalType || firstMed.certificateType || "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{firstMed.issuingClinic || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatExpiryDate(firstMed.expiryDate)}
                          </span>
                          {firstMed.expiryDate && (
                            <span className="text-xs text-gray-600 font-medium">
                              {getDaysUntilExpiry(firstMed.expiryDate) > 0 
                                ? `${getDaysUntilExpiry(firstMed.expiryDate)} days left`
                                : `${Math.abs(getDaysUntilExpiry(firstMed.expiryDate))} days overdue`
                              }
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {statusBadge(getStatus([firstMed.expiryDate]))}
                      </td>
                    </tr>
                    {isExpanded && meds.slice(1).map((m: any, idx: number) => (
                      <tr key={`${rowKey}-sub-${idx}`} className={`${
                        new Date(m.expiryDate || 0) < today ? "bg-red-50" :
                        getDaysUntilExpiry(m.expiryDate) <= 30 ? "bg-amber-50" : "bg-gray-50"
                      }`}>
                        <td className="px-5 py-3 pl-10 text-sm text-gray-500 font-medium">↳ Additional</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-800">
                          {m.name || m.type || m.medicalType || m.certificateType || "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{m.issuingClinic || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatExpiryDate(m.expiryDate)}
                            </span>
                            {m.expiryDate && (
                              <span className="text-xs text-gray-600 font-medium">
                                {getDaysUntilExpiry(m.expiryDate) > 0 
                                  ? `${getDaysUntilExpiry(m.expiryDate)} days left`
                                  : `${Math.abs(getDaysUntilExpiry(m.expiryDate))} days overdue`
                                }
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {statusBadge(getStatus([m.expiryDate]))}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================
   CREW DETAIL MODAL
================================ */
function CrewDetailModal({ crew, onClose }: { crew: CrewMember; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded border border-gray-300 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{crew.fullName}</h2>
            <p className="text-gray-300 mt-0.5 text-sm font-medium">Complete Credential Profile</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="text-white" size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-5">
          
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {crew.email && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                <Mail className="text-gray-700" size={18} strokeWidth={2} />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Email</p>
                  <p className="text-sm text-gray-900 font-medium">{crew.email}</p>
                </div>
              </div>
            )}
            {crew.contactNumber && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                <Phone className="text-gray-700" size={18} strokeWidth={2} />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Contact</p>
                  <p className="text-sm text-gray-900 font-medium">{crew.contactNumber}</p>
                </div>
              </div>
            )}
            {crew.position && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                <Briefcase className="text-gray-700" size={18} strokeWidth={2} />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Position</p>
                  <p className="text-sm text-gray-900 font-medium">{crew.position}</p>
                </div>
              </div>
            )}
            {crew.address && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                <MapPin className="text-gray-700" size={18} strokeWidth={2} />
                <div>
                  <p className="text-xs text-gray-600 font-bold uppercase">Address</p>
                  <p className="text-sm text-gray-900 font-medium">{crew.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          {crew.documents && crew.documents.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase">
                <FileText className="text-gray-700" size={16} strokeWidth={2} />
                Documents ({crew.documents.length})
              </h3>
              <div className="space-y-2">
                {crew.documents.map((doc: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{doc.name || "Unnamed Document"}</p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          Ref: {doc.documentNo || doc.number || doc.referenceNo || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "No expiry"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {crew.certificates && crew.certificates.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase">
                <Award className="text-gray-700" size={16} strokeWidth={2} />
                Certificates ({crew.certificates.length})
              </h3>
              <div className="space-y-2">
                {crew.certificates.map((cert: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5 font-medium">
                          <p>Ref: {cert.documentNo || cert.number || cert.referenceNo || "N/A"}</p>
                          {cert.placeIssued && <p>Issued: {cert.placeIssued}</p>}
                          {cert.trainingCenter && <p>Training: {cert.trainingCenter}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "No expiry"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Records */}
          {crew.medicals && crew.medicals.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2 uppercase">
                <Heart className="text-gray-700" size={16} strokeWidth={2} />
                Medical Records ({crew.medicals.length})
              </h3>
              <div className="space-y-2">
                {crew.medicals.map((med: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {med.name || med.type || med.medicalType || med.certificateType || "Unnamed"}
                        </p>
                        {med.issuingClinic && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">Clinic: {med.issuingClinic}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">
                          {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }) : "No expiry"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}