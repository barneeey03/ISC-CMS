"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import type { CrewMember } from "@/app/lib/type";
import {
  Search,
  Ship,
  X,
  Edit2,
  Trash2,
  Users,
  Anchor,
  Clock,
  Calendar,
  Download,
} from "lucide-react";

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
  setDoc,
} from "firebase/firestore";

import jsPDF from "jspdf";
import "jspdf-autotable";

type VesselAssignment = {
  id?: string;
  crewId: string;
  crewName: string;
  vesselName: string;
  vesselType: string;
  principal: string;
  assignedDate: string;
  signedOn: string;
  signedOff: string | null;
  rank: string;
};

type ConfirmModal = {
  open: boolean;
  type: "assign" | "unassign";
  title: string;
  message: string;
  payload?: any;
};

export default function VesselAssignment() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);

  const [transferData, setTransferData] = useState({
    vesselName: "",
    vesselType: "",
    principal: "",
    signedOn: new Date().toISOString().split("T")[0],
    signedOff: "",
    rank: "",
  });

  const [vesselAssignments, setVesselAssignments] =
    useState<VesselAssignment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState<VesselAssignment | null>(
    null
  );

  // CONFIRM MODAL STATE
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    open: false,
    type: "assign",
    title: "",
    message: "",
  });

  // SEARCH & FILTERS
  const [crewSearch, setCrewSearch] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>("all");

  // HIGHLIGHT FILTER
  const [showHighlightOnly, setShowHighlightOnly] = useState(false);

  // PAGINATION
  const [page, setPage] = useState(1);
  const perPage = 6;

  // ===== Calculate Days Onboard =====
  const calculateDaysOnboard = (signedOn: string, signedOff: string | null) => {
    const startDate = new Date(signedOn);
    const endDate = signedOff ? new Date(signedOff) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ===== Expiring contract =====
  const isExpiring = (signedOn: string, signedOff: string | null) => {
    const days = calculateDaysOnboard(signedOn, signedOff);

    if (!signedOff && days >= 350) return true;

    if (signedOff) {
      const endDate = new Date(signedOff);
      const today = new Date();
      const diff = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diff <= 14;
    }

    return false;
  };

  // ===== Fetch crews =====
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

  // ===== Live listen to assignments collection =====
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

  // ===== Statistics =====
  const statistics = useMemo(() => {
    const activeCrews = vesselAssignments.filter((a) => !a.signedOff).length;
    const completedAssignments = vesselAssignments.filter((a) => a.signedOff)
      .length;
    const uniqueVessels = new Set(
      vesselAssignments.map((a) => a.vesselName)
    ).size;

    const completedDays = vesselAssignments
      .filter((a) => a.signedOff)
      .map((a) => calculateDaysOnboard(a.signedOn, a.signedOff));

    const avgDaysOnboard =
      completedDays.length > 0
        ? Math.round(
            completedDays.reduce((a, b) => a + b, 0) / completedDays.length
          )
        : 0;

    return {
      activeCrews,
      completedAssignments,
      uniqueVessels,
      avgDaysOnboard,
      totalAssignments: vesselAssignments.length,
    };
  }, [vesselAssignments]);

  // ===== Filter crews =====
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

  // ===== Filter assignments =====
  const filteredAssignments = useMemo(() => {
    let filtered = vesselAssignments;

    if (statusFilter === "active") filtered = filtered.filter((a) => !a.signedOff);
    if (statusFilter === "completed")
      filtered = filtered.filter((a) => a.signedOff);

    if (vesselTypeFilter !== "all")
      filtered = filtered.filter((a) => a.vesselType === vesselTypeFilter);

    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.crewName.toLowerCase().includes(q) ||
          a.vesselName.toLowerCase().includes(q) ||
          a.principal.toLowerCase().includes(q)
      );
    }

    if (showHighlightOnly) {
      filtered = filtered.filter(
        (a) => calculateDaysOnboard(a.signedOn, a.signedOff) < 70
      );
    }

    return filtered;
  }, [
    vesselAssignments,
    statusFilter,
    vesselTypeFilter,
    assignmentSearch,
    showHighlightOnly,
  ]);

  const vesselTypes = useMemo(() => {
    return Array.from(new Set(vesselAssignments.map((a) => a.vesselType))).sort();
  }, [vesselAssignments]);

  const totalPages = Math.ceil(filteredAssignments.length / perPage);
  const paginatedAssignments = filteredAssignments.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const getCrewVesselInfo = (crew: CrewMember) => {
    const vesselExperience = crew.vesselExperience || [];

    const latestVessel = vesselExperience
      .slice()
      .sort((a: any, b: any) => new Date(b.signedOn).getTime() - new Date(a.signedOn).getTime())[0];

    return {
      vesselName: latestVessel?.vesselName || "—",
      principal: latestVessel?.principal || "—",
      vesselType: latestVessel?.vesselType || crew.vesselType || "—",
      signedOn: latestVessel?.signedOn || "—",
      signedOff: latestVessel?.signedOff || "—",
      rank: latestVessel?.rank || crew.presentRank || "—",
    };
  };

  const handleCrewSelect = (id: string) => {
    const crew = crews.find((c) => c.id === id) || null;
    setSelectedCrew(crew);

    if (crew) {
      const latestVessel = (crew.vesselExperience || [])
        .slice()
        .sort((a: any, b: any) => new Date(b.signedOn).getTime() - new Date(a.signedOn).getTime())[0];

      setTransferData({
        vesselName: latestVessel?.vesselName || crew.vesselName || "",
        vesselType: latestVessel?.vesselType || crew.vesselType || "",
        principal: latestVessel?.principal || crew.principal || "",
        signedOn: latestVessel?.signedOn || new Date().toISOString().split("T")[0],
        signedOff: latestVessel?.signedOff || "",
        rank: latestVessel?.rank || crew.presentRank || "",
      });
    }
  };

  // ===== Helper to update correct vesselExperience entry =====
  const updateCrewExperience = async (
    crewId: string,
    crewData: CrewMember,
    newExperience: any,
    assignmentId?: string
  ) => {
    const existingExperience = crewData.vesselExperience || [];

    // If there is no experience, just add
    if (existingExperience.length === 0) {
      return [
        {
          ...newExperience,
          experienceId: assignmentId || new Date().getTime().toString(),
        },
      ];
    }

    // If assignmentId exists, update matching entry
    if (assignmentId) {
      const updated = existingExperience.map((exp: any) => {
        if (exp.experienceId === assignmentId) {
          return { ...exp, ...newExperience };
        }
        return exp;
      });

      // If not found, add as new entry
      const found = existingExperience.some(
        (exp: any) => exp.experienceId === assignmentId
      );

      return found
        ? updated
        : [
            ...existingExperience,
            { ...newExperience, experienceId: assignmentId },
          ];
    }

    // If no assignmentId, match by signedOn + vesselName
    const foundIndex = existingExperience.findIndex(
      (exp: any) =>
        exp.vesselName === newExperience.vesselName &&
        exp.signedOn === newExperience.signedOn
    );

    if (foundIndex !== -1) {
      const updated = [...existingExperience];
      updated[foundIndex] = { ...updated[foundIndex], ...newExperience };
      return updated;
    }

    return [
      ...existingExperience,
      { ...newExperience, experienceId: new Date().getTime().toString() },
    ];
  };

  // ===== ASSIGN VESSEL =====
  const handleAssignVessel = async () => {
    if (!selectedCrew) return;

    if (!["approved", "proposed", "fooled"].includes(selectedCrew.status || "")) {
      alert("Only approved/proposed/fooled crews can be assigned.");
      return;
    }

    const newExperienceEntry = {
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      signedOn: transferData.signedOn,
      signedOff: transferData.signedOff || null,
      rank: transferData.rank,
    };

    // CREATE ASSIGNMENT DOC FIRST
    const docRef = await addDoc(collection(db, "vesselAssignments"), {
      crewId: selectedCrew.id,
      crewName: selectedCrew.fullName,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      assignedDate: new Date().toISOString().split("T")[0],
      signedOn: transferData.signedOn,
      signedOff: transferData.signedOff || null,
      rank: transferData.rank,
    });

    // THEN UPDATE CREW EXPERIENCE WITH ASSIGNMENT ID
    const vesselExperience = await updateCrewExperience(
      selectedCrew.id!,
      selectedCrew,
      newExperienceEntry,
      docRef.id
    );

    await updateCrewInFirestore(selectedCrew.id!, {
      vesselExperience,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      presentRank: transferData.rank,
      status: "assigned",
    });

    await updateCrewDatabaseInFirestore(selectedCrew.id!, {
      vesselExperience,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      presentRank: transferData.rank,
      status: "assigned",
    });

    alert("Crew successfully assigned to vessel!");

    setSelectedCrew(null);
    setTransferData({
      vesselName: "",
      vesselType: "",
      principal: "",
      signedOn: new Date().toISOString().split("T")[0],
      signedOff: "",
      rank: "",
    });
    setCrewSearch("");
    setShowModal(false);
  };

  // ===== UNASSIGN =====
  const handleUnassign = async (assignmentId: string, crewId: string) => {
    await deleteDoc(doc(db, "vesselAssignments", assignmentId));

    await updateCrewInFirestore(crewId, {
      vesselName: "",
      vesselType: "",
      principal: "",
      presentRank: "",
      status: "approved",
    });

    await updateCrewDatabaseInFirestore(crewId, {
      vesselName: "",
      vesselType: "",
      principal: "",
      presentRank: "",
      status: "approved",
    });

    alert("Crew has been unassigned.");
  };

  // ===== EDIT ASSIGNMENT =====
  const handleEditAssignment = async (assignment: VesselAssignment) => {
    setEditAssignment(assignment);
    setShowModal(true);

    setTransferData({
      vesselName: assignment.vesselName,
      vesselType: assignment.vesselType,
      principal: assignment.principal,
      signedOn: assignment.signedOn,
      signedOff: assignment.signedOff || "",
      rank: assignment.rank,
    });

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
      signedOn: transferData.signedOn,
      signedOff: transferData.signedOff || null,
      rank: transferData.rank,
    });

    const newExperienceEntry = {
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      signedOn: transferData.signedOn,
      signedOff: transferData.signedOff || null,
      rank: transferData.rank,
    };

    const vesselExperience = await updateCrewExperience(
      selectedCrew.id!,
      selectedCrew,
      newExperienceEntry,
      editAssignment.id
    );

    await updateCrewInFirestore(selectedCrew.id!, {
      vesselExperience,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      presentRank: transferData.rank,
    });

    await updateCrewDatabaseInFirestore(selectedCrew.id!, {
      vesselExperience,
      vesselName: transferData.vesselName,
      vesselType: transferData.vesselType,
      principal: transferData.principal,
      presentRank: transferData.rank,
    });

    setEditAssignment(null);
    setShowModal(false);
    alert("Assignment updated successfully!");
  };

  // ===== EXPORT TO PDF =====
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Vessel Assignments Report", 14, 20);

    const headers = [
      [
        "Crew Name",
        "Rank",
        "Vessel Name",
        "Vessel Type",
        "Principal",
        "Signed On",
        "Signed Off",
        "Days Onboard",
        "Status",
      ],
    ];

    const rows = filteredAssignments.map((a) => {
      const days = calculateDaysOnboard(a.signedOn, a.signedOff);
      const status = a.signedOff ? "Completed" : "Active";
      return [
        a.crewName,
        a.rank,
        a.vesselName,
        a.vesselType,
        a.principal,
        a.signedOn,
        a.signedOff || "",
        days,
        status,
      ];
    });

    (doc as any).autoTable({
      head: headers,
      body: rows,
      startY: 30,
      theme: "striped",
    });

    doc.save(`vessel-assignments-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex min-h-screen bg-linear-to-b from-[#EAF4FF] to-[#FFFFFF]">
        <SuperAdminSidebar />

        <div className="flex-1 min-h-screen lg:ml-64 p-6">
          {/* Header */}
          <div className="bg-white border border-[#D6E6FF] p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-extrabold text-[#003366]">
              Vessel Assignment
            </h1>
            <p className="text-[#6B7A92] mt-1">
              Manage crew assignments and track vessel deployments
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-[#0B6FA4] to-[#0B9DD6] text-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Active Crews
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    {statistics.activeCrews}
                  </h3>
                  <p className="text-blue-100 text-xs mt-1">
                    Currently onboard
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-[#007A5C] to-[#00B18A] text-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Unique Vessels
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    {statistics.uniqueVessels}
                  </h3>
                  <p className="text-green-100 text-xs mt-1">In fleet</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Anchor className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-[#5A2D7C] to-[#9B4DFF] text-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Completed
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    {statistics.completedAssignments}
                  </h3>
                  <p className="text-purple-100 text-xs mt-1">
                    Assignments
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Calendar className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-[#FF7A00] to-[#FFB347] text-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Avg. Days Onboard
                  </p>
                  <h3 className="text-3xl font-bold mt-1">
                    {statistics.avgDaysOnboard}
                  </h3>
                  <p className="text-orange-100 text-xs mt-1">
                    For completed assignments
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Clock className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SELECT CREW */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-[#003366] mb-4">
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
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
                className="w-full bg-[#0B6FA4] text-white py-2 rounded-lg mt-4 hover:bg-[#085A8A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setConfirmModal({
                    open: true,
                    type: "assign",
                    title: "Confirm Assign",
                    message: "Are you sure you want to assign this crew to the vessel?",
                  });
                }}
                disabled={!selectedCrew}
              >
                Assign Vessel
              </button>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#003366] mb-3">
                  Current Assignment Details
                </h3>

                <div className="mt-2 space-y-2">
                  {selectedCrew ? (
                    (() => {
                      const info = getCrewVesselInfo(selectedCrew);
                      return (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Rank:</span>{" "}
                            {info.rank}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Signed On:</span>{" "}
                            {info.signedOn}
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Signed Off:</span>{" "}
                            {info.signedOff}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-8">
                      Select a crew to view details
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ASSIGNMENTS LIST */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#003366]">
                  Vessel Assignments
                </h2>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="Search assignments..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B6FA4] text-sm"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as any)
                  }
                  className="px-4 py-2 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B6FA4] text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="completed">Completed Only</option>
                </select>

                <select
                  value={vesselTypeFilter}
                  onChange={(e) => setVesselTypeFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0B6FA4] text-sm"
                >
                  <option value="all">All Vessel Types</option>
                  {vesselTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <button
                  className={`px-4 py-2 rounded-lg border ${
                    showHighlightOnly
                      ? "bg-red-200 text-black"
                      : "bg-gray-50"
                  }`}
                  onClick={() => setShowHighlightOnly(!showHighlightOnly)}
                >
                  Highlight {"<70 days"}
                </button>
              </div>

              {/* Scrollable list */}
              <div className="max-h-130 overflow-y-auto pr-2">
                {paginatedAssignments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    {filteredAssignments.length === 0 && vesselAssignments.length > 0
                      ? "No assignments match your filters."
                      : "No assignments yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedAssignments.map((a) => {
                      const daysOnboard = calculateDaysOnboard(a.signedOn, a.signedOff);
                      const isActive = !a.signedOff;
                      const isHighlight = daysOnboard < 70;
                      const expiring = isExpiring(a.signedOn, a.signedOff);

                      return (
                        <div
                          key={a.id}
                          className={`border-l-4 ${
                            isActive ? "border-green-500" : "border-gray-300"
                          } p-4 rounded-lg shadow-sm hover:shadow-md transition bg-white ${
                            isHighlight ? "bg-yellow-50" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-[#003366]">
                                {a.crewName} • {a.rank}
                              </p>
                              <span className="text-xs text-gray-500">
                                Assigned: {a.assignedDate}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {expiring && (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                                  Expiring
                                </span>
                              )}

                              {isActive ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Vessel:</span>{" "}
                              {a.vesselName}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Type:</span>{" "}
                              {a.vesselType}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Principal:</span>{" "}
                              {a.principal}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Signed On:</span>{" "}
                              {a.signedOn}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Signed Off:</span>{" "}
                              {a.signedOff || ""}
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Days Onboard:</span>{" "}
                              <span className="text-blue-600 font-bold">
                                {daysOnboard} days
                              </span>
                            </p>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                              onClick={() => handleEditAssignment(a)}
                              title="Edit Assignment"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                              onClick={() =>
                                setConfirmModal({
                                  open: true,
                                  type: "unassign",
                                  title: "Confirm Unassign",
                                  message:
                                    "Are you sure you want to delete this assignment?",
                                  payload: { assignmentId: a.id, crewId: a.crewId },
                                })
                              }
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
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages} • {filteredAssignments.length} total assignments
                  </span>

                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== MODAL ===== */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Ship className="w-5 h-5 text-[#0B6FA4]" />
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
                  editAssignment ? handleUpdateAssignment() : handleAssignVessel();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
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
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
                    placeholder="e.g., MV Ocean Star"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
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
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
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
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
                    placeholder="e.g., Global Shipping Ltd."
                    required
                  />
                </div>

                {/* NEW FIELD: RANK */}
                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
                    Rank
                  </label>
                  <input
                    value={transferData.rank}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        rank: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
                    placeholder="e.g., Chief Officer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
                    Sign On Date
                  </label>
                  <input
                    type="date"
                    value={transferData.signedOn}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        signedOn: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#003366] mb-1">
                    Sign Off Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={transferData.signedOff}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        signedOff: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B6FA4]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty if crew is still onboard/no signed on
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                    onClick={() => {
                      setShowModal(false);
                      setEditAssignment(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#0B6FA4] text-white hover:bg-[#085A8A] transition"
                  >
                    {editAssignment ? "Update Assignment" : "Assign Vessel"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== CONFIRM MODAL ===== */}
        {confirmModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{confirmModal.title}</h2>
                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-700 mb-6">{confirmModal.message}</p>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                  onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 rounded-lg bg-[#0B6FA4] text-white hover:bg-[#085A8A] transition"
                  onClick={async () => {
                    setConfirmModal({ ...confirmModal, open: false });

                    if (confirmModal.type === "assign") {
                      setShowModal(true);
                    }

                    if (confirmModal.type === "unassign") {
                      const { assignmentId, crewId } = confirmModal.payload;
                      await handleUnassign(assignmentId, crewId);
                    }
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
