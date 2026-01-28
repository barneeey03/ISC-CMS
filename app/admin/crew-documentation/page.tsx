"use client";

import { JSX, Key, useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { CrewMember } from "@/app/lib/type";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { tr } from "date-fns/locale";

/* ================================
   TYPES
================================ */
type StatusType = "valid" | "expiring" | "expired";
type StatusFilterType = "all" | StatusType | "expiredOnly";

interface DocumentRow { 
  crewName: string; 
  documents: string; 
  documentNos: string; 
  expiries: string; 
  status: StatusType; 
}

interface CertificateRow { 
  crewName: string; 
  certificates: string; 
  documentNos: string; 
  placeIssued: string; 
  trainingCenters: string; 
  expiries: string; 
  status: StatusType; 
}

interface MedicalRow { 
  crewName: string; 
  medicalTypes: string; 
  issuingClinics: string; 
  expiries: string; 
  status: StatusType; 
}

/* ================================
   MAIN COMPONENT
================================ */
export default function CrewDocumentations() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<"documents" | "certificates" | "medical">("documents");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");

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

  /* ================================
     BUILD ROWS
  ================================ */
  const documentRows = useMemo<DocumentRow[]>(() => crews.map(crew => {
    const docs = crew.documents || [];
    return {
      crewName: crew.fullName,
      documents: docs.map(d => d.name || "—").join(", "),
      documentNos: docs.map(d => d.documentNo ?? d.number ?? d.referenceNo ?? "—").join(", "),
      expiries: formatDate(docs.map(d => d.expiryDate ?? null)),
      status: getStatus(docs.map(d => d.expiryDate ?? null)),
      rawDocs: docs.map(d => ({
        name: d.name || "—",
        documentNo: d.documentNo ?? d.number ?? d.referenceNo ?? "—",
        expiryDate: d.expiryDate ?? null
      })) // normalize for table
    };
  }), [crews]);

  const certificateRows = useMemo<CertificateRow[]>(() => crews.map(crew => {
    const certs = crew.certificates || [];
    return {
      crewName: crew.fullName,
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
      medicalTypes: meds.map((m: { name: any; type: any; medicalType: any; certificateType: any; }) => m.name || m.type || m.medicalType || m.certificateType || "—").join(", "),
      issuingClinics: meds.map((m: { issuingClinic: any; }) => m.issuingClinic || "—").join(", "),
      expiries: formatDate(meds.map((m: { expiryDate: any; }) => m.expiryDate || null)),
      status: getStatus(meds.map((m: { expiryDate: any; }) => m.expiryDate || null))
    };
  }), [crews]);

  /* ================================
     FILTERING
  ================================ */
  const filterRows = <T extends { crewName: string; status: StatusType }>(rows: T[]): T[] =>
    rows.filter(r => {
      const matchesSearch = r.crewName.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "expiredOnly") return r.status === "expired";
      return r.status === statusFilter;
    });

  const filteredDocuments = filterRows(documentRows);
  const filteredCertificates = filterRows(certificateRows);
  const filteredMedicals = filterRows(medicalRows);

  /* ================================
     STATUS BADGE
  ================================ */
  const statusBadge = (status: StatusType) => {
    if (status === "expired") return <span className="flex items-center gap-1 text-red-600 font-semibold"><XCircle size={14}/> Expired</span>;
    if (status === "expiring") return <span className="flex items-center gap-1 text-orange-500 font-semibold"><AlertTriangle size={14}/> Expiring</span>;
    return <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14}/> Valid</span>;
  };

  /* ================================
     RENDER ROWS
  ================================ */
  const renderDocumentRow = (r: DocumentRow, i: Key): JSX.Element | JSX.Element[] => {
    const crew = crews.find(c => c.fullName === r.crewName);
    const docs = crew?.documents || [];
    
    // 🔍 ADD THIS TO DEBUG
    console.log('Documents for', r.crewName, ':', docs);
    
    if (docs.length === 0) return (
      <tr key={i} className="border-b">
        <td className="px-6 py-3 font-bold">{r.crewName}</td>
        <td className="px-6 py-3" colSpan={4}>No documents</td>
      </tr>
    );

    return docs.map((d, idx) => (
      <tr key={`${i}-${idx}`} className={`border-b ${
        new Date(d.expiryDate || 0) < today ? "bg-red-50" :
        new Date(d.expiryDate || 0).getTime() - today.getTime() <= 30*24*60*60*1000 ? "bg-orange-50" : ""
      }`}>
        {idx === 0 && <td className="px-6 py-3 font-bold" rowSpan={docs.length}>{r.crewName}</td>}
        <td className="px-6 py-3">{d.name || "—"}</td>
        <td className="px-6 py-3">
          {d.documentNo || d.number || d.referenceNo || d.placeIssued || "—"}
        </td>
        <td className="px-6 py-3">{formatExpiryDate(d.expiryDate)}</td>
        <td className="px-6 py-3">{statusBadge(getStatus([d.expiryDate]))}</td>
      </tr>
    ));
  };

  const renderCertificateRow = (r: CertificateRow, i: Key): JSX.Element | JSX.Element[] => {
    const certs = crews.find(c => c.fullName === r.crewName)?.certificates || [];
    if (certs.length === 0) return (
      <tr key={i} className="border-b">
        <td className="px-6 py-3 font-bold">{r.crewName}</td>
        <td className="px-6 py-3" colSpan={6}>No certificates</td>
      </tr>
    );

    return certs.map((c, idx) => (
      <tr key={`${i}-${idx}`} className={`border-b ${
        new Date(c.expiryDate || 0) < today ? "bg-red-50" :
        new Date(c.expiryDate || 0).getTime() - today.getTime() <= 30*24*60*60*1000 ? "bg-orange-50" : ""
      }`}>
        {idx === 0 && <td className="px-6 py-3 font-bold" rowSpan={certs.length}>{r.crewName}</td>}
        <td className="px-6 py-3">{c.name}</td>
        <td className="px-6 py-3">{c.documentNo || c.number || c.referenceNo || "—"}</td>
        <td className="px-6 py-3">{c.placeIssued || "—"}</td>
        <td className="px-6 py-3">{c.trainingCenter || "—"}</td>
        <td className="px-6 py-3">{formatExpiryDate(c.expiryDate)}</td>
        <td className="px-6 py-3">{statusBadge(getStatus([c.expiryDate]))}</td>
      </tr>
    ));
  };

  const renderMedicalRow = (r: MedicalRow, i: Key): JSX.Element | JSX.Element[] => {
    const meds = crews.find(c => c.fullName === r.crewName)?.medicals || [];
    if (meds.length === 0) return (
      <tr key={i} className="border-b">
        <td className="px-6 py-3 font-bold">{r.crewName}</td>
        <td className="px-6 py-3" colSpan={4}>No medical records</td>
      </tr>
    );

    return meds.map((m: { expiryDate: string | number | Date | null; name: any; type: any; medicalType: any; certificateType: any; issuingClinic: any; }, idx: number) => (
      <tr key={`${i}-${idx}`} className={`border-b ${
        new Date(m.expiryDate || 0) < today ? "bg-red-50" :
        new Date(m.expiryDate || 0).getTime() - today.getTime() <= 30*24*60*60*1000 ? "bg-orange-50" : ""
      }`}>
        {idx === 0 && <td className="px-6 py-3 font-bold" rowSpan={meds.length}>{r.crewName}</td>}
        <td className="px-6 py-3">{m.name || m.type || m.medicalType || m.certificateType || "—"}</td>
        <td className="px-6 py-3">{m.issuingClinic || "—"}</td>
        <td className="px-6 py-3">{formatExpiryDate(m.expiryDate)}</td>
        <td className="px-6 py-3">{statusBadge(getStatus([m.expiryDate]))}</td>
      </tr>
    ));
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
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b p-6 shadow">
            <h1 className="text-3xl font-extrabold text-[#002060]">Crew Documentations</h1>
            <p className="text-[#6B87A6] mt-1 text-sm">Monitor all documents, certificates, and medical records professionally</p>
          </div>

          <div className="pt-28 px-6 pb-10">

            {/* SEARCH + FILTERS */}
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <div className="flex items-center gap-2 flex-1 bg-white rounded-xl shadow p-3">
                <Search size={18} className="text-gray-400"/>
                <input
                  className="w-full px-3 py-2 border-none focus:ring-0 focus:outline-none"
                  placeholder="Search crew name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select 
                className="border px-3 py-2 rounded-lg" 
                value={selectedSection} 
                onChange={(e) => setSelectedSection(e.target.value as "documents" | "certificates" | "medical")}
              >
                <option value="documents">Documents</option>
                <option value="certificates">Certificates</option>
                <option value="medical">Medical Records</option>
              </select>

              <select 
                className="border px-3 py-2 rounded-lg" 
                value={statusFilter} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (["all","valid","expiring","expired","expiredOnly"].includes(value)) {
                    setStatusFilter(value as StatusFilterType);
                  }
                }}
              >
                <option value="all">All</option>
                <option value="valid">Valid</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="expiredOnly">Expired Only</option>
              </select>
            </div>

            {/* TABLES */}
            {selectedSection === "documents" && (
              <SectionTable
                columns={["Crew Name","Documents","Document Nos.","Expiry","Status"]}
                rows={filteredDocuments}
                renderRow={renderDocumentRow}
                colorClass="bg-[#002060]"
              />
            )}

            {selectedSection === "certificates" && (
              <SectionTable
                columns={["Crew Name","Certificates","Document Nos.","Place Issued","Training Center","Expiry","Status"]}
                rows={filteredCertificates}
                renderRow={renderCertificateRow}
                colorClass="bg-purple-700"
              />
            )}

            {selectedSection === "medical" && (
              <SectionTable
                columns={["Crew Name","Medical Types","Issuing Clinics","Expiry","Status"]}
                rows={filteredMedicals}
                renderRow={renderMedicalRow}
                colorClass="bg-teal-700"
              />
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ================================
   SECTION TABLE
================================ */
function SectionTable({
  columns,
  rows,
  renderRow,
  colorClass
}: {
  columns: string[],
  rows: any[],
  renderRow: (r:any,i:Key)=>JSX.Element | JSX.Element[],
  colorClass: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-auto border border-gray-100">
      <table className="w-full text-sm text-center min-w-175">
        <thead className={`${colorClass} text-white sticky top-0`}>
          <tr>{columns.map(c => <th key={c} className="px-6 py-3">{c}</th>)}</tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
