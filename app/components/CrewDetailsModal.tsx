"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { CrewMember } from "@/app/lib/type";

export function CrewDetailsModal({
  crew,
  onClose,
  onApprove,
  onDisapprove,
}: {
  crew: CrewMember;
  onClose: () => void;
  onApprove: (id: string, remarks?: string) => void;
  onDisapprove: (id: string, remarks?: string) => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>("basic");

  // MODALS
  const [confirmType, setConfirmType] = useState<null | "passed" | "failed">(null);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState("");

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const openConfirm = (type: "passed" | "failed") => {
    setConfirmType(type);
    setRemarks("");
  };

  const confirmAction = () => {
    if (confirmType === "passed") {
      onApprove(crew.id, "Passed");
      setConfirmType(null);
      onClose();
    } else if (confirmType === "failed") {
      setConfirmType(null);
      setShowRemarks(true);
    }
  };

  const submitRemarks = () => {
    setShowRemarks(false);
    onDisapprove(crew.id, remarks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Crew Details</h2>
          <button onClick={onClose} className="text-black/60 hover:text-black">
            <X />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => openConfirm("passed")}
              className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold"
            >
              Passed
            </button>

            <button
              onClick={() => openConfirm("failed")}
              className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold"
            >
              Failed
            </button>
          </div>

          {/* CONFIRMATION MODAL */}
          {confirmType && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6">
                <h3 className="font-bold text-lg">
                  {confirmType === "passed" ? "Confirm Approval" : "Confirm Failure"}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {confirmType === "passed"
                    ? "Are you sure you want to mark this crew as PASSED?"
                    : "Are you sure you want to mark this crew as FAILED?"}
                </p>

                <div className="flex gap-3 mt-4 justify-end">
                  <button
                    onClick={() => setConfirmType(null)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REMARKS MODAL */}
          {showRemarks && (
            <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6">
                <h3 className="font-bold text-lg">Why did the crew fail?</h3>

                <textarea
                  className="w-full mt-3 p-3 border rounded-lg text-sm"
                  rows={5}
                  placeholder="Enter reason for failure..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />

                <div className="flex gap-3 mt-4 justify-end">
                  <button
                    onClick={() => setShowRemarks(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRemarks}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ====== DETAILS SECTIONS ====== */}
          <Section
            title="Basic Information"
            isOpen={openSection === "basic"}
            onToggle={() => toggleSection("basic")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Full Name" value={crew.fullName} />
              <Detail label="Email" value={crew.emailAddress} />
              <Detail label="Mobile" value={crew.mobileNumber} />
              <Detail label="Age" value={String(crew.age)} />
              <Detail label="Nationality" value={crew.nationality} />
              <Detail label="Place of Birth" value={crew.placeOfBirth} />
              <Detail label="Date of Birth" value={crew.dateOfBirth} />
              <Detail label="Gender" value={crew.gender} />
              <Detail label="Civil Status" value={crew.civilStatus} />
              <Detail label="Uniform Size" value={crew.uniformSize} />
              <Detail label="Religion" value={crew.religion} />
              <Detail label="No. of Children" value={crew.numOfChildren} />
              <Detail label="Complete Address" value={crew.completeAddress} />
            </div>
          </Section>

          {/* ... rest of sections remain unchanged ... */}
          
          <Section
            title="Application Information"
            isOpen={openSection === "application"}
            onToggle={() => toggleSection("application")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Date Applied" value={crew.dateApplied} />
              <Detail label="Present Rank" value={crew.presentRank} />
              <Detail label="Province" value={crew.province} />
              <Detail label="Date of Availability" value={crew.dateOfAvailability} />
              <Detail label="Previous Salary" value={crew.prevSalary} />
              <Detail label="Expected Salary" value={crew.expectedSalary} />
              <Detail label="Vessel Type" value={crew.vesselType} />
              <Detail label="Rank" value={crew.rank} />
            </div>
          </Section>

          <Section
            title="Next of Kin"
            isOpen={openSection === "kin"}
            onToggle={() => toggleSection("kin")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Next of Kin" value={crew.nextOfKin} />
              <Detail label="Next of Kin Address" value={crew.nextOfKinAddress} />
            </div>
          </Section>

          <Section
            title="Education"
            isOpen={openSection === "education"}
            onToggle={() => toggleSection("education")}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="School Attended" value={crew.schoolAttended} />
              <Detail label="Course" value={crew.course} />
              <Detail label="Year Graduated" value={crew.yearGraduated} />
              <Detail label="High School" value={crew.highSchool.schoolName} />
              <Detail label="HS Year Graduated" value={crew.highSchool.yearGraduated} />
              <Detail label="College" value={crew.college.schoolName} />
              <Detail label="College Course" value={crew.college.course} />
              <Detail label="College Year Graduated" value={crew.college.yearGraduated} />
            </div>
          </Section>

          <Section
            title="For Office Use"
            isOpen={openSection === "office"}
            onToggle={() => toggleSection("office")}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Detail label="Height" value={crew.height} />
              <Detail label="Weight" value={crew.weight} />
              <Detail label="BMI" value={crew.bmi} />
              <Detail label="Ishihara Test" value={crew.ishihara} />
            </div>
          </Section>

          <Section
            title="Documents"
            isOpen={openSection === "documents"}
            onToggle={() => toggleSection("documents")}
          >
            {crew.documents.length === 0 ? (
              <p className="text-sm text-gray-600">No documents added.</p>
            ) : (
              <div className="space-y-2">
                {crew.documents.map((d) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg"
                  >
                    <Detail label="Document" value={d.name} />
                    <Detail label="Number" value={d.placeIssued} />
                    <Detail label="Issued" value={d.dateIssued} />
                    <Detail label="Expiry" value={d.expiryDate} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Medical"
            isOpen={openSection === "medical"}
            onToggle={() => toggleSection("medical")}
          >
            {crew.medical ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Detail label="Certificate Type" value={crew.medical.certificateType} />
                <Detail label="Issuing Clinic" value={crew.medical.issuingClinic} />
                <Detail label="Date Issued" value={crew.medical.dateIssued} />
                <Detail label="Expiry Date" value={crew.medical.expiryDate} />
              </div>
            ) : (
              <p className="text-sm text-gray-600">No medical record.</p>
            )}
          </Section>

          {/* Remarks Section */}
          <Section
            title="Remarks"
            isOpen={openSection === "remarks"}
            onToggle={() => toggleSection("remarks")}
          >
            <p className="text-sm whitespace-pre-wrap">
              {crew.remarks || "—"}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

// Section component
function Section({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-[#E0E8F0] rounded-xl">
      <button
        className="w-full flex items-center justify-between p-4 bg-[#F9FBFD] rounded-t-xl"
        onClick={onToggle}
      >
        <span className="font-bold text-[#0080C0]">{title}</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>

      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

// Reusable component for details
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-black/60">{label}</p>
      <p className="font-semibold">{value || "—"}</p>
    </div>
  );
}
