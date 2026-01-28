"use client";

import { useState, useMemo, useEffect } from "react";
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

function calculateDaysOnboard(crew: CrewMember): number | null {
  if (!crew?.dateJoined) return null;

  const joinedDate = new Date(crew.dateJoined);
  if (isNaN(joinedDate.getTime())) return null;

  const today = new Date();
  const diffTime = today.getTime() - joinedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}


/* ============================
   TYPES
============================ */
type ExamStatus = "all" | "passed" | "failed" | "pending" | "on-hold";

/* ============================
   ASYNC LOADERS
============================ */
const fetchRanks = async (): Promise<string[]> =>
  Promise.resolve([
    "Master","Chief Officer","2nd Officer","3rd Officer",
    "BOSUN","AB","OS","Deck Cadet",
    "Chief Engineer","2nd Engineer","3rd Engineer","4th Engineer",
    "Oiler","WPR","Engine Cadet","Messman","Chief Cook","Fitter","ETO","ETR",
  ]);

const fetchPrincipals = async (): Promise<string[]> =>
  Promise.resolve([
    "Skeiron","LMJ Ship Management LLC","Grand Asian Shipping Lines",
    "ISC","Guangzhou Huayang Maritime Co., LTD.","Vallianz",
    "Dynamic Marine Services","Molyneux Marine",
  ]);

const fetchVesselTypes = async (): Promise<string[]> =>
  Promise.resolve([
    "Container","Bulk Carrier","Oil Tanker","LPG","AHTS",
    "Crew Boat","Heavy Lift","General Cargo",
  ]);

/* ============================
   ASYNC MULTI SELECT
============================ */
interface AsyncMultiSelectProps {
  label: string;
  selected: string[];
  onChange: (val: string[]) => void;
  loader: () => Promise<string[]>;
}

const AsyncMultiSelect = ({
  label,
  selected,
  onChange,
  loader,
}: AsyncMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && options.length === 0) {
      loader().then(setOptions);
    }
  }, [open, loader, options.length]);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val]
    );
  };

  return (
    <div className="relative bg-white border border-gray-300 rounded shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 text-left text-sm font-medium"
      >
        {label}
        {selected.length > 0 && ` (${selected.length})`}
      </button>

      {open && (
        <div className="absolute z-30 w-full bg-white border border-gray-300 rounded shadow-lg p-2 max-h-64 overflow-y-auto">
          <input
            className="w-full mb-2 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder={`Search ${label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {options
            .filter((o) =>
              o.toLowerCase().includes(search.toLowerCase())
            )
            .map((opt) => (
              <label
                key={opt}
                className="flex gap-2 py-1 text-sm font-medium cursor-pointer"
              >
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
interface ChipProps {
  label: string;
  onRemove: () => void;
}

const Chip = ({ label, onRemove }: ChipProps) => (
  <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
    {label}
    <button onClick={onRemove} className="font-bold">✕</button>
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

  const [showReconsiderConfirm, setShowReconsiderConfirm] = useState(false);
  const [reconsiderTargetId, setReconsiderTargetId] = useState<string | null>(null);

  /* ============================
     FIRESTORE SYNC
  ============================ */
  useEffect(() => {
    const ref = collection(db, "crewApplications");
    return onSnapshot(ref, (snap) => {
      setCrews(
        snap.docs.map((d) => ({ ...(d.data() as CrewMember), id: d.id }))
      );
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, examStatus, rankFilter, principalFilter, vesselTypeFilter]);

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

  /* ============================
     FILTERING
  ============================ */
  const filteredCrews = useMemo(() => {
    return crews.filter((crew) => {
      const vessel = getVesselInfo(crew);

      if (examStatus !== "all" && crew.status !== examStatus) return false;
      if (rankFilter.length && !rankFilter.includes(crew.presentRank)) return false;
      if (principalFilter.length && !principalFilter.includes(vessel.principal)) return false;
      if (vesselTypeFilter.length && !vesselTypeFilter.includes(vessel.vesselType)) return false;
      if (searchQuery && !crew.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [crews, examStatus, rankFilter, principalFilter, vesselTypeFilter, searchQuery]);

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
     ACTIONS
  ============================ */
  const handleApprove = async (id: string) =>
    updateCrewInFirestore(id, { status: "passed", remarks: "Passed" });

  const handleDisapprove = async (id: string) =>
    updateCrewInFirestore(id, { status: "failed", remarks: "Failed" });

  const handleReconsider = async (id: string) =>
    updateCrewInFirestore(id, {
      status: "on-hold",
      remarks: "Reconsidered - On Hold",
    });

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
            <div className="px-8 py-5 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900" style={{letterSpacing: '-0.02em'}}>Crew Applications</h1>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">
            {/* BUTTONS (TOP RIGHT) */}
            <div className="flex justify-end gap-2 mb-6">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                Export PDF
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Add Crew
              </button>
            </div>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded border border-gray-300 col-span-3 md:col-span-2">
                <Search className="w-4 h-4 text-gray-400" strokeWidth={2} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name..."
                  className="w-full outline-none text-sm font-medium"
                />
              </div>

              <select
                value={examStatus}
                onChange={(e) =>
                  setExamStatus(e.target.value as ExamStatus)
                }
                className="px-4 py-3 border border-gray-300 rounded text-sm font-medium bg-white col-span-2"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="on-hold">On-Hold</option>
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
            <div className="overflow-x-auto bg-white rounded border border-gray-300 shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-white">
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
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedCrews.map((crew) => {
                    const vessel = getVesselInfo(crew);
                    const days = calculateDaysOnboard(crew);
                    const highlight = days !== null && days < 70;

                    return (
                      <tr
                        key={crew.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          highlight
                            ? "bg-red-50 border-l-4 border-red-600"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {crew.fullName}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-700">
                          {crew.presentRank}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {vessel.vesselType}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {vessel.principal}
                        </td>
                        <td className="px-5 py-3 text-center font-medium text-gray-700">
                          {getAge(crew.dateOfBirth)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase
                              ${
                                crew.status === "passed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : crew.status === "failed"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : crew.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                          >
                            {crew.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {crew.remarks || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCrew(crew)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Eye size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => setEditCrew(crew)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Edit2 size={16} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTargetId(crew.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>

                            {/* NEW RECONSIDER BUTTON */}
                            {crew.status === "failed" && (
                              <button
                                onClick={() => {
                                  setReconsiderTargetId(crew.id);
                                  setShowReconsiderConfirm(true);
                                }}
                                className="px-3 py-1 rounded bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition-colors"
                              >
                                Reconsider
                              </button>
                            )}
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
              <span className="text-sm text-gray-600 font-medium">
                Page {page} of {Math.ceil(filteredCrews.length / perPage)}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page * perPage >= filteredCrews.length}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
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

          {/* DELETE CONFIRM */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded border border-gray-300">
                <h2 className="font-bold text-lg mb-4 text-gray-900">
                  Delete this crew?
                </h2>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={async () => {
                      if (!deleteTargetId) return;
                      await deleteCrewFromFirestore(deleteTargetId);
                      setShowDeleteConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RECONSIDER CONFIRM (NEW) */}
          {showReconsiderConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded border border-gray-300">
                <h2 className="font-bold text-lg mb-4 text-gray-900">
                  Reconsider this application?
                </h2>
                <p className="mb-4 text-sm text-gray-600 font-medium">
                  Once confirmed, status will change to <b>On-Hold</b>.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowReconsiderConfirm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={async () => {
                      if (!reconsiderTargetId) return;
                      await handleReconsider(reconsiderTargetId);
                      setShowReconsiderConfirm(false);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded text-sm font-semibold hover:bg-yellow-600 transition-colors"
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