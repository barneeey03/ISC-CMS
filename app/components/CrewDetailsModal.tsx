"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { CrewMember } from "@/app/lib/type";

export function CrewDetailsModal({
  crew,
  onClose,
  onApprove,
  onDisapprove,
  onProposed,
  onFooled,          // <-- ADD THIS
}: {
  crew: CrewMember;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDisapprove: (id: string, reconsider?: boolean) => void;
  onProposed: (id: string) => void;
  onFooled: (id: string) => void;   // <-- ADD THIS
}) {

  const [openSection, setOpenSection] = useState<string | null>("basic");
  const [showReconsider, setShowReconsider] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
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
              onClick={() => onProposed(crew.id)}
              className="px-4 py-2 rounded-lg bg-yellow-400 text-white font-semibold"
            >
              Proposed
            </button>

            <button
              onClick={() => onApprove(crew.id)}
              className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold"
            >
              Approve
            </button>

            <button
              onClick={() => setShowReconsider(true)}
              className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold"
            >
              Disapprove
            </button>
          </div>

          {showReconsider && (
            <div className="p-4 border rounded-xl bg-red-50">
              <p className="font-semibold text-red-700">
                Do you want to reconsider?
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => onDisapprove(crew.id, true)}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-white font-semibold"
                >
                  Yes (Fooled)
                </button>
                <button
                  onClick={() => onDisapprove(crew.id, false)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold"
                >
                  No (Disapproved)
                </button>
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

          <Section
            title="Certificates"
            isOpen={openSection === "certificates"}
            onToggle={() => toggleSection("certificates")}
          >
            {crew.certificates.length === 0 ? (
              <p className="text-sm text-gray-600">No certificates added.</p>
            ) : (
              <div className="space-y-2">
                {crew.certificates.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg"
                  >
                    <Detail label="Name" value={c.name} />
                    <Detail label="No." value={c.number} />
                    <Detail label="Issued" value={c.dateIssued} />
                    <Detail label="Valid Until" value={c.validUntil} />
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Vessel Experience"
            isOpen={openSection === "vessel"}
            onToggle={() => toggleSection("vessel")}
          >
            {crew.vesselExperience.length === 0 ? (
              <p className="text-sm text-gray-600">No vessel experience added.</p>
            ) : (
              <div className="space-y-2">
                {crew.vesselExperience.map((v) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg"
                  >
                    <Detail label="Vessel Name" value={v.vesselName} />
                    <Detail label="Rank" value={v.rank} />
                    <Detail label="Vessel Type" value={v.vesselType} />
                    <Detail label="Manning Company" value={v.manningCompany} />
                    <Detail label="Principal" value={v.principal} />
                    <Detail label="Flag" value={v.flag} />
                    <Detail label="GRT" value={v.grt} />
                    <Detail label="Engine Maker" value={v.engineMaker} />
                    <Detail label="Trading" value={v.trading} />
                    <Detail label="Route" value={v.route} />
                    <Detail label="Signed On" value={v.signedOn} />
                    <Detail label="Signed Off" value={v.signedOff} />
                    <Detail label="Cause of Discharge" value={v.causeOfDischarge} />
                  </div>
                ))}
              </div>
            )}
          </Section>

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
