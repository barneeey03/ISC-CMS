"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewMember } from "@/app/lib/dataStore";
import { Search, Ship, X, Edit2, Trash2 } from "lucide-react";

import {
  updateCrewInFirestore,
  updateCrewDatabaseInFirestore,
} from "@/app/lib/crewservice";

import { db } from "@/app/lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type VesselAssignment = {
  id?: string;
  crewId: string;
  crewName: string;
  vesselName: string;
  vesselType: string;
  principal: string;
  assignedDate: string;
};

export default function VesselAssignment() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);

  const [transferData, setTransferData] = useState({
    vesselName: "",
    vesselType: "",
    principal: "",
  });

  const [vesselAssignments, setVesselAssignments] = useState<VesselAssignment[]>(
    []
  );

  const [showModal, setShowModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState<VesselAssignment | null>(
    null
  );

  // SEARCH
  const [crewSearch, setCrewSearch] = useState("");

  // PAGINATION
  const [page, setPage] = useState(1);
  const perPage = 6;

  // Fetch crews
  useEffect(() => {
    const crewRef = collection(db, "crewApplications");
    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const list: CrewMember[] = [];
      snapshot.forEach((doc) => {
        list.push({
          ...(doc.data() as any),
          id: doc.id,
        });
      });
      setCrews(list);
    });

    return () => unsubscribe();
  }, []);

  // Live listen to assignments collection in Firestore
  useEffect(() => {
    const q = query(
      collection(db, "vesselAssignments"),
      orderBy("assignedDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: VesselAssignment[] = [];
      snapshot.forEach((doc) => {
        list.push({
          ...(doc.data() as any),
          id: doc.id,
        });
      });
      setVesselAssignments(list);
    });

    return () => unsubscribe();
  }, []);

  const filteredCrews = useMemo(() => {
    const filtered = crews.filter(
      (c) =>
        c.status === "approved" ||
        c.status === "proposed" ||
        c.status === "fooled"
    );

    if (!crewSearch.trim()) return filtered;

    return filtered.filter((c) => {
      const q = crewSearch.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.emailAddress.toLowerCase().includes(q) ||
        c.mobileNumber.toLowerCase().includes(q)
      );
    });
  }, [crews, crewSearch]);

  // pagination for assignments
  const totalPages = Math.ceil(vesselAssignments.length / perPage);
  const paginatedAssignments = vesselAssignments.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Get current assignment info from crewExperience
  const getCrewVesselInfo = (crew: CrewMember) => {
    const vessel = crew.vesselExperience?.[0];
    return {
      vesselName: vessel?.vesselName || "—",
      principal: vessel?.principal || "—",
      vesselType: crew.vesselType || "—",
    };
  };

  // When crew selected -> autofill current data
  const handleCrewSelect = (id: string) => {
    const crew = crews.find((c) => c.id === id) || null;
    setSelectedCrew(crew);

    if (crew) {
      setTransferData({
        vesselName: crew.vesselName || "",
        vesselType: crew.vesselType || "",
        principal: crew.principal || "",
      });
    }
  };

  // Assign Vessel (Transfer)
  const handleAssignVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrew) return;

    // STATUS VALIDATION
    if (
      !["approved", "proposed", "fooled"].includes(selectedCrew.status || "")
    ) {
      alert("Only approved/proposed/fooled crews can be assigned.");
      return;
    }

    const vesselExperience = [
      {
        vesselName: transferData.vesselName,
        vesselType: transferData.vesselType,
        principal: transferData.principal,
        signedOn: new Date().toISOString().split("T")[0],
        signedOff: null,
      },
    ];

    await updateCrewInFirestore(selectedCrew.id!, {
      vesselExperience,
      status: "assigned",
    });

    await updateCrewDatabaseInFirestore(selectedCrew.id!, {
      vesselExperience,
      status: "assigned",
    });


    // Save assignment to Firestore
    await addDoc(collection(db, "vesselAssignments"), {
      crewId: selectedCrew.id,
      crewName: selectedCrew.fullName,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      assignedDate: new Date().toISOString().split("T")[0],
    });

    setSelectedCrew(null);
    setTransferData({ vesselName: "", vesselType: "", principal: "" });
    setCrewSearch("");
    setShowModal(false);
  };

// UNASSIGN
const handleUnassign = async (assignmentId: string, crewId: string) => {
  const confirmUnassign = confirm("Are you sure you want to unassign this crew?");
  if (!confirmUnassign) return;

  // Delete assignment document
  await deleteDoc(doc(db, "vesselAssignments", assignmentId));

  // Clear crew vessel data
  await updateCrewInFirestore(crewId, {
    vesselExperience: [],
    vesselName: "",
    vesselType: "",
    principal: "",
    status: "approved",
  });

  await updateCrewDatabaseInFirestore(crewId, {
    vesselExperience: [],
    vesselName: "",
    vesselType: "",
    principal: "",
    status: "approved",
  });

  alert("Crew has been unassigned.");
};


  // EDIT ASSIGNMENT
  const handleEditAssignment = async (assignment: VesselAssignment) => {
    setEditAssignment(assignment);
    setShowModal(true);

    // Load existing data
    setTransferData({
      vesselName: assignment.vesselName,
      vesselType: assignment.vesselType,
      principal: assignment.principal,
    });

    // Select the crew
    const crew = crews.find((c) => c.id === assignment.crewId) || null;
    setSelectedCrew(crew);
  };

  const handleUpdateAssignment = async () => {
    if (!selectedCrew || !editAssignment) return;

    const docRef = doc(db, "vesselAssignments", editAssignment.id!);

    await updateDoc(docRef, {
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
    });

    // Update crew document
    await updateCrewInFirestore(selectedCrew.id!, {
      vesselExperience: [
        {
          vesselName: transferData.vesselName,
          vesselType: transferData.vesselType,
          principal: transferData.principal,
          signedOn: editAssignment.assignedDate,
          signedOff: null,
        },
      ],
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
    });

    await updateCrewDatabaseInFirestore(selectedCrew.id!, {
      vesselExperience: [
        {
          vesselName: transferData.vesselName,
          vesselType: transferData.vesselType,
          principal: transferData.principal,
          signedOn: editAssignment.assignedDate,
          signedOff: null,
        },
      ],
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
    });

    setEditAssignment(null);
    setShowModal(false);
    alert("Assignment updated!");
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen bg-linear-to-b from-[#F4F9FF] to-[#FFFFFF]">
        <SuperAdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 p-6">
          <div className="bg-white border-b border-[#E0E8F0] p-6 rounded-lg shadow-sm">
            <h1 className="text-3xl font-extrabold text-[#002060]">
              Vessel Assignment
            </h1>
            <p className="text-[#6B7A92] mt-1">
              Assign crew to vessel with ease
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* SELECT CREW */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#002060] mb-4">
                Select Crew
              </h2>

              <div className="relative mb-4">
                <div className="absolute left-3 top-3">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={crewSearch}
                  onChange={(e) => setCrewSearch(e.target.value)}
                  placeholder="Search crew by name, email, or contact..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <select
                className="w-full px-4 py-2 rounded-lg border"
                onChange={(e) => handleCrewSelect(e.target.value)}
                value={selectedCrew?.id || ""}
              >
                <option value="">Choose a crew member</option>
                {filteredCrews.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} • {c.presentRank}
                  </option>
                ))}
              </select>

              <button
                className="w-full bg-[#0080C0] text-white py-2 rounded-lg mt-4 hover:bg-blue-700 transition"
                onClick={() => setShowModal(true)}
                disabled={!selectedCrew}
              >
                Assign Vessel
              </button>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#002060]">
                  Current Assignment Details
                </h3>

                <div className="mt-2 space-y-2">
                  {selectedCrew ? (
                    (() => {
                      const info = getCrewVesselInfo(selectedCrew);
                      return (
                        <>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Vessel Name:</span>{" "}
                            {info.vesselName}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Vessel Type:</span>{" "}
                            {info.vesselType}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Principal:</span>{" "}
                            {info.principal}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500">Select a crew</div>
                  )}
                </div>
              </div>
            </div>

            {/* ASSIGNMENTS LIST */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#002060]">
                  Vessel Assignments
                </h2>
                <span className="text-sm text-gray-500">
                  Live updates from Firestore
                </span>
              </div>

              {paginatedAssignments.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No assignments yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedAssignments.map((a) => {
                    const crew = crews.find((c) => c.id === a.crewId);
                    return (
                      <div
                        key={a.id}
                        className="border p-4 rounded-lg shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-[#002060]">
                            {a.crewName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {a.assignedDate}
                          </span>
                        </div>

                        <p className="text-gray-700">
                          <span className="font-semibold">Status:</span>{" "}
                          {crew?.status || "—"}
                        </p>

                        <p className="text-gray-700">
                          <span className="font-semibold">Vessel:</span>{" "}
                          {a.vesselName}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Type:</span>{" "}
                          {a.vesselType}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Principal:</span>{" "}
                          {a.principal}
                        </p>

                        <div className="flex gap-2 justify-end mt-3">
                          <button
                            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                            onClick={() => handleEditAssignment(a)}
                            title="Edit Assignment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                            onClick={() => handleUnassign(a.id!, a.crewId)}
                            title="Unassign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION */}
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MODAL ===== */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  {editAssignment ? "Edit Assignment" : "Assign Vessel"}
                </h2>
                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={() => {
                    setShowModal(false);
                    setEditAssignment(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editAssignment ? handleUpdateAssignment() : handleAssignVessel(e);
                }}
                className="space-y-4"
              >
                <label className="text-sm font-semibold text-[#002060]">
                  Vessel Name
                </label>
                <input
                  value={transferData.vesselName}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      vesselName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g., MV Ocean Star"
                  required
                />

                <label className="text-sm font-semibold text-[#002060]">
                  Vessel Type
                </label>
                <select
                  value={transferData.vesselType}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      vesselType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                >
                  <option value="">Select vessel type</option>
                  <option value="Container Ship">Container Ship</option>
                  <option value="Tanker">Tanker</option>
                  <option value="Bulk Carrier">Bulk Carrier</option>
                  <option value="General Cargo">General Cargo</option>
                  <option value="RoRo Ship">RoRo Ship</option>
                  <option value="Refrigerated">Refrigerated</option>
                </select>

                <label className="text-sm font-semibold text-[#002060]">
                  Principal / Shipping Company
                </label>
                <input
                  value={transferData.principal}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      principal: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g., Global Shipping Ltd."
                  required
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                    onClick={() => {
                      setShowModal(false);
                      setEditAssignment(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#0080C0] text-white hover:bg-blue-700 transition"
                  >
                    {editAssignment ? "Update Assignment" : "Assign Vessel"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
