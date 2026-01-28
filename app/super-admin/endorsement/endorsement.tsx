"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SuperAdminSidebar } from "@/app/components/SuperAdminSidebar";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { CrewApplicationForm } from "@/app/components/CrewApplicationForm";
import { CrewDetailsModal } from "@/app/components/CrewDetailsModal";
import { CrewMember } from "@/app/lib/type";
import { Eye, Edit2, Send, Search, Download } from "lucide-react";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { generateCrewCV } from "@/app/lib/cvGenerator";

type Principal =
  | "Skeiron"
  | "LMJ Ship Management LLC"
  | "Grand Asian Shipping Lines"
  | "ISC"
  | "Guangzhou Huayang Maritime Co., LTD."
  | "Vallianz"
  | "Dynamic Marine Services"
  | "Molyneux Marine"
  | "Nixin"
  | "Trawind";

export default function EndorsementModule() {
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);
  const [proposeCrew, setProposeCrew] = useState<CrewMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>("all");
  const [principalFilter, setPrincipalFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const principals: Principal[] = [
    "Skeiron",
    "LMJ Ship Management LLC",
    "Grand Asian Shipping Lines",
    "ISC",
    "Guangzhou Huayang Maritime Co., LTD.",
    "Vallianz",
    "Dynamic Marine Services",
    "Molyneux Marine",
    "Nixin",
    "Trawind",
  ];

  useEffect(() => {
    const crewRef = collection(db, "crewApplications");

    const unsubscribe = onSnapshot(crewRef, (snapshot) => {
      const list: CrewMember[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as any),
        id: doc.id,
      }));
      // Only show crews with passed document status
      const passedCrews = list.filter( (crew) => crew.status === "passed");
      setCrews(passedCrews);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => setPage(1), [searchQuery, rankFilter, vesselTypeFilter, principalFilter]);

  /* ============================
     HELPERS
  ============================ */
  const getAge = (dob?: string) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return "—";
    return Math.abs(new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970);
  };

  const getLatestVessel = (crew: CrewMember) => {
    const vessels = crew.vesselExperience || [];
    const sorted = [...vessels].sort((a, b) => {
      const aDate = a.signedOn ? new Date(a.signedOn).getTime() : 0;
      const bDate = b.signedOn ? new Date(b.signedOn).getTime() : 0;
      return bDate - aDate;
    });
    return sorted[0];
  };

  const getVesselInfo = (crew: CrewMember) => {
    const lastVessel = getLatestVessel(crew);
    return {
      vesselType: lastVessel?.vesselType || crew.vesselType || "—",
      vesselName: lastVessel?.vesselName || "—",
      principal: lastVessel?.principal || "—",
    };
  };

  const getUniqueRanks = () => {
    const ranks = new Set<string>();
    crews.forEach((crew) => {
      if (crew.presentRank) ranks.add(crew.presentRank);
    });
    return Array.from(ranks).sort();
  };

  const getUniqueVesselTypes = () => {
    const types = new Set<string>();
    crews.forEach((crew) => {
      const vessel = getVesselInfo(crew);
      if (vessel.vesselType !== "—") types.add(vessel.vesselType);
    });
    return Array.from(types).sort();
  };

  const getUniquePrincipals = () => {
    const principals = new Set<string>();
    crews.forEach((crew) => {
      const vessel = getVesselInfo(crew);
      if (vessel.principal !== "—") principals.add(vessel.principal);
    });
    return Array.from(principals).sort();
  };

  /* ============================
     FILTERING + PAGINATION
  ============================ */
  const filteredCrews = useMemo(() => {
    let list = crews.filter((crew) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        crew.fullName.toLowerCase().includes(q) ||
        crew.emailAddress.toLowerCase().includes(q) ||
        crew.mobileNumber.includes(q);

      const matchesRank = rankFilter === "all" || crew.presentRank === rankFilter;

      const vessel = getVesselInfo(crew);
      const matchesVesselType =
        vesselTypeFilter === "all" || vessel.vesselType === vesselTypeFilter;

      const matchesPrincipal =
        principalFilter === "all" || vessel.principal === principalFilter;

      return matchesSearch && matchesRank && matchesVesselType && matchesPrincipal;
    });

    return list;
  }, [crews, searchQuery, rankFilter, vesselTypeFilter, principalFilter]);

  const totalPages = Math.ceil(filteredCrews.length / perPage);
  const paginatedCrews = filteredCrews.slice((page - 1) * perPage, page * perPage);

  /* ============================
     PROPOSE CREW TO PRINCIPAL
  ============================ */
  const handleProposeClick = (crew: CrewMember) => {
    setProposeCrew(crew);
  };

  const handlePrincipalSelect = async (principal: Principal) => {
    if (!proposeCrew) return;

    try {
      // Generate CV based on principal
      const cvBlob = await generateCrewCV(proposeCrew, principal);
      const cvFileName = `${proposeCrew.fullName.replace(/\s+/g, "_")}_CV_${principal.replace(/\s+/g, "_")}.${
        principal === "Skeiron" || principal === "Vallianz" ? "xlsx" : "docx"
      }`;

      // Create a temporary download link
      const url = URL.createObjectURL(cvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cvFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Open Gmail compose with pre-filled subject and body
      const subject = encodeURIComponent(
        `Crew Endorsement - ${proposeCrew.fullName} for ${principal}`
      );
      const body = encodeURIComponent(
        `Dear ${principal} Team,\n\nI am pleased to endorse ${proposeCrew.fullName} for your consideration.\n\n` +
          `Crew Details:\n` +
          `Name: ${proposeCrew.fullName}\n` +
          `Rank: ${proposeCrew.presentRank}\n` +
          `Nationality: ${proposeCrew.nationality || "N/A"}\n` +
          `Email: ${proposeCrew.emailAddress}\n` +
          `Mobile: ${proposeCrew.mobileNumber}\n\n` +
          `Please find the attached CV for your review.\n\n` +
          `Best regards`
      );

      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
        "_blank"
      );

      setProposeCrew(null);
    } catch (error) {
      console.error("Error generating CV:", error);
      alert("Failed to generate CV. Please try again.");
    }
  };

  /* ============================
     RENDER
  ============================ */
  return (
    <ProtectedRoute requiredRole="super-admin">
      <div className="flex">
        <SuperAdminSidebar />
        <div className="flex-1 min-h-screen lg:ml-64 bg-linear-to-b from-[#F4F9FF] to-[#FFFFFF]">
          {/* HEADER */}
          <div className="fixed top-0 left-0 right-0 z-20 lg:ml-64 bg-white border-b shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#002060]">
                  Crew Endorsement Module
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Endorse passed crew members to principals
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="pt-24 px-6 pb-10">
            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Search */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700"
                />
              </div>

              {/* Rank Filter */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700"
                >
                  <option value="all">All Ranks</option>
                  {getUniqueRanks().map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vessel Type Filter */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <select
                  value={vesselTypeFilter}
                  onChange={(e) => setVesselTypeFilter(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700"
                >
                  <option value="all">All Vessel Types</option>
                  {getUniqueVesselTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Principal Filter */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <select
                  value={principalFilter}
                  onChange={(e) => setPrincipalFilter(e.target.value)}
                  className="w-full outline-none text-sm text-gray-700"
                >
                  <option value="all">All Principals</option>
                  {getUniquePrincipals().map((principal) => (
                    <option key={principal} value={principal}>
                      {principal}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* INFO BADGE */}
            {filteredCrews.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  No crews with "passed" document status found matching your filters.
                </p>
              </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
              <div className="max-h-150 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#002060] text-white sticky top-0">
                    <tr>
                      {[
                        "Rank",
                        "Name",
                        "Vessel Type",
                        "Vessel Name",
                        "Principal",
                        "Age",
                        "Email",
                        "Mobile",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCrews.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                          No crew members found
                        </td>
                      </tr>
                    ) : (
                      paginatedCrews.map((crew) => {
                        const vessel = getVesselInfo(crew);

                        return (
                          <tr
                            key={crew.id}
                            className="hover:bg-blue-50 border-b transition-colors"
                          >
                            <td className="px-4 py-3 text-center text-sm">
                              {crew.presentRank}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium">
                              {crew.fullName}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {vessel.vesselType}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {vessel.vesselName}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">{vessel.principal}</td>
                            <td className="px-4 py-3 text-center text-sm">
                              {getAge(crew.dateOfBirth)}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {crew.emailAddress}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {crew.mobileNumber}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  crew.status === "approved" || crew.status === "assigned"
                                    ? "bg-green-100 text-green-700"
                                    : crew.status === "pending"
                                    ? "bg-orange-100 text-orange-700"
                                    : crew.status === "proposed"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : crew.status === "pooled"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {crew.status === "assigned"
                                  ? "ACTIVE"
                                  : crew.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                {/* View Button */}
                                <button
                                  onClick={() => setSelectedCrew(crew)}
                                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => setEditCrew(crew)}
                                  className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                                  title="Edit Crew"
                                >
                                  <Edit2 className="w-4 h-4 text-green-600" />
                                </button>

                                {/* Propose Button */}
                                <button
                                  onClick={() => handleProposeClick(crew)}
                                  className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                                  title="Propose to Principal"
                                >
                                  <Send className="w-4 h-4 text-purple-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 0 && (
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages} • Showing {filteredCrews.length} crew
                  {filteredCrews.length !== 1 ? "s" : ""}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CREW DETAILS MODAL */}
          {selectedCrew && (
            <CrewDetailsModal crew={selectedCrew} onClose={() => setSelectedCrew(null)} onApprove={function (id: string, remarks?: string): void {
              throw new Error("Function not implemented.");
            } } onDisapprove={function (id: string, remarks?: string): void {
              throw new Error("Function not implemented.");
            } } />
          )}

          {/* EDIT CREW FORM */}
          {editCrew && (
            <CrewApplicationForm
              mode="edit"
              crew={editCrew}
              onClose={() => setEditCrew(null)}
              onSuccess={() => setEditCrew(null)}
            />
          )}

          {/* PROPOSE TO PRINCIPAL MODAL */}
          {proposeCrew && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-[#002060]">
                    Propose {proposeCrew.fullName} to Principal
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select a principal to generate CV and send endorsement email
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {principals.map((principal) => (
                      <button
                        key={principal}
                        onClick={() => handlePrincipalSelect(principal)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#002060] hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700 group-hover:text-[#002060]">
                            {principal}
                          </span>
                          <Send className="w-4 h-4 text-gray-400 group-hover:text-[#002060]" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                  <button
                    onClick={() => setProposeCrew(null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
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