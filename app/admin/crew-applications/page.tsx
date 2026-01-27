"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AdminSidebar } from "@/app/components/AdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { CrewMember } from "@/app/lib/type";

import { Plus, Eye, Edit2, Trash2, Download, Search } from "lucide-react";
import jsPDF from "jspdf";

import {
  updateCrewInFirestore,
  deleteCrewFromFirestore,
} from "@/app/lib/crewservice";

import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

/* ============================
   TYPES
============================ */
type ExamStatus = "all" | "passed" | "failed";

/* ============================
   ASYNC LOADERS
============================ */
const fetchRanks = async () =>
  Promise.resolve([
    "Master","Chief Officer","2nd Officer","3rd Officer",
    "BOSUN","AB","OS","Deck Cadet",
    "Chief Engineer","2nd Engineer","3rd Engineer","4th Engineer",
    "Oiler","WPR","Engine Cadet","Messman","Chief Cook","Fitter","ETO","ETR",
  ]);

const fetchPrincipals = async () =>
  Promise.resolve([
    "Skeiron","LMJ Ship Management LLC","Grand Asian Shipping Lines",
    "ISC","Guangzhou Huayang Maritime Co., LTD.","Vallianz",
    "Dynamic Marine Services","Molyneux Marine",
  ]);

const fetchVesselTypes = async () =>
  Promise.resolve([
    "Container","Bulk Carrier","Oil Tanker","LPG","AHTS",
    "Crew Boat","Heavy Lift","General Cargo",
  ]);

/* ============================
   ASYNC MULTI SELECT
============================ */
const AsyncMultiSelect = ({
  label,
  selected,
  onChange,
  loader,
}: any) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && options.length === 0) loader().then(setOptions);
  }, [open]);

  const toggle = (val: string) =>
    onChange(
      selected.includes(val)
        ? selected.filter((v: string) => v !== val)
        : [...selected, val]
    );

  return (
    <div className="relative bg-white border rounded-lg shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left text-sm"
      >
        {label} {selected.length > 0 && `(${selected.length})`}
      </button>

      {open && (
        <div className="absolute z-30 w-full bg-white border rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto">
          <input
            className="w-full mb-2 px-2 py-1 border rounded text-sm"
            placeholder={`Search ${label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {options
            .filter((o) =>
              o.toLowerCase().includes(search.toLowerCase())
            )
            .map((opt) => (
              <label key={opt} className="flex gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                {opt}
              </label>
            ))}
        </div>
      )}
    </div>
  );
};

/* ============================
   CHIP
============================ */
const Chip = ({ label, onRemove }: any) => (
  <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
    {label}
    <button onClick={onRemove}>✕</button>
  </span>
);

/* ============================
   MAIN COMPONENT
============================ */
export default function CrewApplications() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [examStatus, setExamStatus] = useState<ExamStatus>("all");

  const [rankFilter, setRankFilter] = useState<string[]>([]);
  const [principalFilter, setPrincipalFilter] = useState<string[]>([]);
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const perPage = 8;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* ============================
     FIRESTORE SYNC
  ============================ */
  useEffect(() => {
    const ref = collection(db, "crewApplications");
    return onSnapshot(ref, (snap) =>
      setCrews(snap.docs.map((d) => ({ ...(d.data() as any), id: d.id })))
    );
  }, []);

  useEffect(() => setPage(1), [
    searchQuery,
    examStatus,
    rankFilter,
    principalFilter,
    vesselTypeFilter,
  ]);

  /* ============================
     HELPERS
  ============================ */
  const getAge = (dob?: string) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "—";
    return Math.abs(
      new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970
    );
  };

  const getLatestVessel = (crew: CrewMember) =>
    [...(crew.vesselExperience || [])].sort(
      (a, b) =>
        new Date(b.signedOn || 0).getTime() -
        new Date(a.signedOn || 0).getTime()
    )[0];

  const getVesselInfo = (crew: CrewMember) => {
    const v = getLatestVessel(crew);
    return {
      vesselType: v?.vesselType || "—",
      principal: v?.principal || "—",
    };
  };

  const calculateDaysOnboard = (crew: CrewMember) => {
    const v = getLatestVessel(crew);
    if (!v?.signedOn) return null;
    const start = new Date(v.signedOn).getTime();
    const end = v.signedOff ? new Date(v.signedOff).getTime() : Date.now();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  /* ============================
     FILTERING
  ============================ */
  const filteredCrews = useMemo(() => {
    return crews.filter((crew) => {
      const vessel = getVesselInfo(crew);

      if (
        examStatus !== "all" &&
        (examStatus === "passed"
          ? !["approved", "assigned"].includes(crew.status)
          : crew.status !== "disapproved")
      )
        return false;

      if (rankFilter.length && !rankFilter.includes(crew.presentRank))
        return false;

      if (
        principalFilter.length &&
        !principalFilter.includes(vessel.principal)
      )
        return false;

      if (
        vesselTypeFilter.length &&
        !vesselTypeFilter.includes(vessel.vesselType)
      )
        return false;

      if (
        searchQuery &&
        !crew.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      return true;
    });
  }, [
    crews,
    examStatus,
    rankFilter,
    principalFilter,
    vesselTypeFilter,
    searchQuery,
  ]);

  const paginatedCrews = filteredCrews.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ============================
     PDF EXPORT
  ============================ */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Crew Applications Report", 14, 20);
    doc.save("crew_applications_report.pdf");
  };

  /* ============================
     RENDER
  ============================ */
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex">
        <AdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 bg-gray-50">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
              <h1 className="text-xl font-semibold">Crew Applications</h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-24 px-6 pb-10">
            {/* BUTTONS (TOP RIGHT) */}
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Crew
              </button>
            </div>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border col-span-3 md:col-span-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name..."
                  className="w-full outline-none text-sm"
                />
              </div>

              <select
                value={examStatus}
                onChange={(e) =>
                  setExamStatus(e.target.value as ExamStatus)
                }
                className="px-4 py-3 border rounded-lg text-sm bg-white col-span-2"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>

              <AsyncMultiSelect
                label="Rank"
                selected={rankFilter}
                onChange={setRankFilter}
                loader={fetchRanks}
              />

              <AsyncMultiSelect
                label="Principal"
                selected={principalFilter}
                onChange={setPrincipalFilter}
                loader={fetchPrincipals}
              />

              <AsyncMultiSelect
                label="Vessel Type"
                selected={vesselTypeFilter}
                onChange={setVesselTypeFilter}
                loader={fetchVesselTypes}
              />
            </div>

            {/* FILTER CHIPS */}
            <div className="flex flex-wrap gap-2 mb-4">
              {rankFilter.map((r) => (
                <Chip
                  key={r}
                  label={`Rank: ${r}`}
                  onRemove={() =>
                    setRankFilter(rankFilter.filter((x) => x !== r))
                  }
                />
              ))}
              {principalFilter.map((p) => (
                <Chip
                  key={p}
                  label={`Principal: ${p}`}
                  onRemove={() =>
                    setPrincipalFilter(
                      principalFilter.filter((x) => x !== p)
                    )
                  }
                />
              ))}
              {vesselTypeFilter.map((v) => (
                <Chip
                  key={v}
                  label={`Vessel: ${v}`}
                  onRemove={() =>
                    setVesselTypeFilter(
                      vesselTypeFilter.filter((x) => x !== v)
                    )
                  }
                />
              ))}
              {examStatus !== "all" && (
                <Chip
                  label={`Status: ${examStatus}`}
                  onRemove={() => setExamStatus("all")}
                />
              )}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white rounded-xl shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-[#002060] text-white">
                  <tr>
                    {[
                      "Name",
                      "Rank",
                      "Vessel Type",
                      "Principal",
                      "Age",
                      "Status",
                      "Remarks",
                      "Action",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedCrews.map((crew) => {
                    const vessel = getVesselInfo(crew);
                    const days = calculateDaysOnboard(crew);
                    const highlight = days !== null && days < 70;

                    return (
                      <tr
                        key={crew.id}
                        className={`border-b hover:bg-gray-50 ${
                          highlight
                            ? "bg-red-50 border-l-4 border-red-600"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {crew.fullName}
                        </td>
                        <td className="px-4 py-3">
                          {crew.presentRank}
                        </td>
                        <td className="px-4 py-3">
                          {vessel.vesselType}
                        </td>
                        <td className="px-4 py-3">
                          {vessel.principal}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getAge(crew.dateOfBirth)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs
                              ${
                                crew.status === "approved" ||
                                crew.status === "assigned"
                                  ? "bg-green-100 text-green-700"
                                  : crew.status === "disapproved"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {crew.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {crew.remarks || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCrew(crew)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setEditCrew(crew)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTargetId(crew.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(filteredCrews.length / perPage)}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={page * perPage >= filteredCrews.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* MODALS */}
          {selectedCrew && (
            <CrewDetailsModal
              crew={selectedCrew}
              onClose={() => setSelectedCrew(null)}
              onApprove={function (id: string): void {
                throw new Error("Function not implemented.");
              }}
              onDisapprove={function (id: string, reconsider?: boolean): void {
                throw new Error("Function not implemented.");
              }}
              onProposed={function (id: string): void {
                throw new Error("Function not implemented.");
              }}
              onPooled={function (id: string): void {
                throw new Error("Function not implemented.");
              }}
            />
          )}

          {showAddForm && (
            <CrewApplicationForm
              mode="add"
              onClose={() => setShowAddForm(false)}
              onSuccess={() => setShowAddForm(false)}
            />
          )}

          {editCrew && (
            <CrewApplicationForm
              mode="edit"
              crew={editCrew}
              onClose={() => setEditCrew(null)}
              onSuccess={() => setEditCrew(null)}
            />
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl">
                <h2 className="font-semibold mb-4">
                  Delete this crew?
                </h2>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                  >
                    No
                  </button>
                  <button
                    onClick={async () => {
                      if (!deleteTargetId) return;
                      await deleteCrewFromFirestore(deleteTargetId);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
