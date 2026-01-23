"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  dataStore,
  Certificate,
  CrewMember,
  VesselExperience,
} from "@/app/lib/dataStore";
import { addCrewToFirestore, updateCrewInFirestore } from "@/app/lib/crewservice";
import { serverTimestamp } from "firebase/firestore";

type CrewFormData = Omit<CrewMember, "id" | "createdAt"> & {
  age: string;
};

interface CrewApplicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  mode?: "add" | "edit";
  crew?: Partial<CrewMember>;
}

const inputStyle =
  "px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm transition";

const OFFICE_DOCUMENTS = [
  "Passport",
  "SIRB",
  "U.S Visa",
  "MARINA SRN",
  "DMW E-Reg No",
];

const CERTIFICATES = [
  "C.O.P. BASIC TRAINING",
  "C.O.P. ADVANCED TRAINING IN FIRE FIGHTING",
  "C.O.P. SURVICAL CRAFT & RESCUE BOAT",
  "C.O.P. FAST RESCUE BOAT",
  "C.O.P. MEDICAL FIRST AID",
  "C.O.P. BASIC TRAINING OIL/ CHEMICAL TANKER",
  "C.O.P. BASIC TRAINING LIQUEFIED GAS TANKER",
  "C.O.P. ADVANCED TRAINING IN OIL TANKER",
  "C.O.P. ADVANCED TRAINING IN CHEMICAL TANKER",
  "C.O.P. ADVANCE TRAINING IN LIQUEFIED GAS TANKER",
  "C.O.P. SHIP SECURITY OFFICER",
  "CO.P. SEAFARER WITH DESIGNATED SECURITY DUTIES (SDSD-SAT)",
  "SHIP'S CATERING NC I (MESSMAN COURSE)",
  "SHIP'S CATERING NC III (SHIP'S COOK)",
  "CRANE CERTIFICATE",
  "WELDING CERTIFICATE",
  "ECDIS (GENERIC)",
  "ECDIS (SPECIFIC)",
];

export function CrewApplicationForm({
  onClose,
  onSuccess,
  mode = "add",
  crew,
}: CrewApplicationFormProps) {
  const [formData, setFormData] = useState<CrewFormData>({
    dateApplied: "",
    presentRank: "",
    prevSalary: "",
    province: "",
    dateOfAvailability: "",
    expectedSalary: "",
    placeOfBirth: "",
    numOfChildren: "",
    religion: "",
    nextOfKin: "",
    nextOfKinAddress: "",
    schoolAttended: "",
    weight: "",
    course: "",
    yearGraduated: "",
    bmi: "",
    ishihara: "",

    certificates: [],
    vesselExperience: [],

    fullName: "",
    fathersName: "",
    mothersName: "",
    dateOfBirth: "",
    age: "",
    nationality: "",
    gender: "",
    height: "",
    uniformSize: "",
    civilStatus: "",

    mobileNumber: "",
    emailAddress: "",
    completeAddress: "",

    highSchool: { schoolName: "", yearGraduated: "" },
    college: { schoolName: "", course: "", yearGraduated: "" },

    documents: [
      {
        id: `doc-${Date.now()}`,
        name: "",
        placeIssued: "",
        dateIssued: "",
        expiryDate: "",
      },
    ],

    seaService: [],
    medical: { certificateType: "", issuingClinic: "", dateIssued: "", expiryDate: "" },

    vesselType: "",
    status: "pending",

    rank: "",
    remarks: "",
  });

  useEffect(() => {
    if (mode === "edit" && crew) {
      setFormData((prev) => ({
        ...prev,
        ...crew,
        age: crew.age ? String(crew.age) : prev.age,
        vesselExperience:
          crew.vesselExperience?.map((v, index) => ({
            id: v.id || `vexp-${Date.now()}-${index}`,
            manningCompany: v.manningCompany || "",
            principal: v.principal || "",
            rank: v.rank || "",
            vesselName: v.vesselName || "",
            flag: v.flag || "",
            vesselType: v.vesselType || "",
            grt: v.grt || "",
            engineMaker: v.engineMaker || "",
            trading: v.trading || "",
            route: v.route || "",
            signedOn: v.signedOn || "",
            signedOff: v.signedOff || "",
            causeOfDischarge: v.causeOfDischarge || "",
          })) || [],
        certificates:
          crew.certificates?.map((c, index) => ({
            id: c.id || `cert-${Date.now()}-${index}`,
            name: c.name || "",
            number: c.number || "",
            dateIssued: c.dateIssued || "",
            validUntil: c.validUntil || "",
          })) || [],
        documents:
          crew.documents?.map((d, index) => ({
            id: d.id || `doc-${Date.now()}-${index}`,
            name: d.name || "",
            placeIssued: d.placeIssued || "",
            dateIssued: d.dateIssued || "",
            expiryDate: d.expiryDate || "",
          })) || prev.documents,
      }));
    }
  }, [mode, crew]);

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return String(age);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "dateOfBirth") {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: value,
        age: calculateAge(value),
      }));
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          id: `cert-${Date.now()}-${Math.random()}`,
          name: "",
          number: "",
          dateIssued: "",
          validUntil: "",
        },
      ],
    }));
  };

  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: "",
          placeIssued: "",
          dateIssued: "",
          expiryDate: "",
        },
      ],
    }));
  };

  const removeDocument = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d: { id: string }) => d.id !== id),
    }));
  };

  const updateDocument = (
    id: string,
    field: "name" | "placeIssued" | "dateIssued" | "expiryDate",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((d: { id: string }) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  };

  const removeCertificate = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((c: { id: string }) => c.id !== id),
    }));
  };

  const updateCertificate = (
    id: string,
    field: keyof Certificate,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c: { id: string }) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addVesselExperience = () => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: [
        ...prev.vesselExperience,
        {
          id: `vexp-${Date.now()}-${Math.random()}`,
          manningCompany: "",
          principal: "",
          rank: "",
          vesselName: "",
          flag: "",
          vesselType: "",
          grt: "",
          engineMaker: "",
          trading: "",
          route: "",
          signedOn: "",
          signedOff: "",
          causeOfDischarge: "",
        },
      ],
    }));
  };

  const removeVesselExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: prev.vesselExperience.filter(
        (v: { id: string }) => v.id !== id
      ),
    }));
  };

  const updateVesselExperience = (
    id: string,
    field: keyof VesselExperience,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: prev.vesselExperience.map((v: { id: string }) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  // 🔥 NEW: Sort Vessel Experience by signedOn DESC before saving
  const sortVesselExperienceLatestFirst = (vessels: VesselExperience[]) => {
    return [...vessels].sort((a, b) => {
      const aDate = a.signedOn ? new Date(a.signedOn).getTime() : 0;
      const bDate = b.signedOn ? new Date(b.signedOn).getTime() : 0;
      return bDate - aDate;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sortedVesselExperience = sortVesselExperienceLatestFirst(
      formData.vesselExperience
    );

    const payload = {
      ...formData,
      vesselExperience: sortedVesselExperience,
      age: Number(formData.age),
      createdAt: serverTimestamp(),
    };

    try {
      if (mode === "edit" && crew?.id) {
        await updateCrewInFirestore(crew.id, payload);
      } else {
        await addCrewToFirestore(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Firestore Error:", error);
      alert("Failed to submit: " + (error?.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#E0E8F0] bg-white">
          <h2 className="text-2xl font-extrabold text-[#002060]">
            {mode === "edit" ? "Edit Crew Application" : "Crew Application Form"}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-[#80A0C0] hover:text-[#002060]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* BASIC INFO */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Application Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="dateApplied"
                type="date"
                value={formData.dateApplied}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Date Applied"
              />

              <input
                name="presentRank"
                value={formData.presentRank}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Present Rank"
              />

              <input
                name="prevSalary"
                value={formData.prevSalary}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Previous Salary (USD)"
              />

              <input
                name="dateOfAvailability"
                type="date"
                value={formData.dateOfAvailability}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Date of Availability"
              />

              <input
                name="expectedSalary"
                value={formData.expectedSalary}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Expected Salary (USD)"
              />

              <input
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Position Applied For"
              />
            </div>
          </section>

          {/* PERSONAL */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Full Name"
              />
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className={inputStyle}
              />
              <input
                name="age"
                value={formData.age}
                readOnly
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#EEF4FA] text-[#002060] cursor-not-allowed text-sm"
                placeholder="Age"
              />

              <input
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Place of Birth"
              />

              <input
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Gender"
              />

              <input
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Civil Status"
              />

              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Contact"
              />

              <input
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Email Address"
              />

              <input
                name="completeAddress"
                value={formData.completeAddress}
                onChange={handleInputChange}
                required
                className={`md:col-span-3 ${inputStyle}`}
                placeholder="Home Address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input
                name="numOfChildren"
                value={formData.numOfChildren}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="No. of Children"
              />
              <input
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Religion"
              />
              <input
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Nationality"
              />
              <input
                name="uniformSize"
                value={formData.uniformSize}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Uniform Size"
              />
            </div>
          </section>

          {/* NEXT OF KIN */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Next of Kin
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nextOfKin"
                value={formData.nextOfKin}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Name of Next of Kin / Relationship"
              />
              <input
                name="nextOfKinAddress"
                value={formData.nextOfKinAddress}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Address"
              />
            </div>
          </section>

          {/* EDUCATION */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Education
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="schoolAttended"
                value={formData.schoolAttended}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Name of School Attended"
              />
              <input
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Course"
              />
              <input
                name="yearGraduated"
                value={formData.yearGraduated}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Year Graduated"
              />
            </div>
          </section>

          {/* VESSEL TYPE */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Vessel Type
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="vesselType"
                value={formData.vesselType}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Vessel Type"
              />
            </div>
          </section>

          {/* FOR OFFICE USE ONLY */}
          <section className="border border-[#E0E8F0] rounded-xl p-6 bg-[#F9FBFD]">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              FOR OFFICE USE ONLY
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Height (cm)"
                type="number"
                min="0"
              />

              <input
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Weight (kg)"
                type="number"
                min="0"
              />

              <input
                name="bmi"
                value={formData.bmi}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="BMI"
                type="text"
              />

              <select
                name="ishihara"
                value={formData.ishihara}
                onChange={handleInputChange}
                className={inputStyle}
              >
                <option value="">Ishihara Test</option>
                <option value="Normal">Normal</option>
                <option value="Defective">Defective</option>
              </select>
            </div>
          </section>

          {/* DOCUMENTS */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0080C0]">
                Documents
              </h3>
              <button
                type="button"
                onClick={addDocument}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>

            <div className="space-y-3">
              {formData.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
                >
                  <select
                    value={doc.name}
                    onChange={(e) =>
                      updateDocument(doc.id, "name", e.target.value)
                    }
                    className={inputStyle}
                  >
                    <option value="">Select Document</option>
                    {OFFICE_DOCUMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <input
                    value={doc.placeIssued}
                    onChange={(e) =>
                      updateDocument(doc.id, "placeIssued", e.target.value)
                    }
                    className={inputStyle}
                    placeholder="Document No."
                  />

                  <input
                    type="date"
                    value={doc.dateIssued}
                    onChange={(e) =>
                      updateDocument(doc.id, "dateIssued", e.target.value)
                    }
                    className={inputStyle}
                  />

                  <input
                    type="date"
                    value={doc.expiryDate}
                    onChange={(e) =>
                      updateDocument(doc.id, "expiryDate", e.target.value)
                    }
                    className={inputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="flex items-center justify-center border border-[#D0E0F0] rounded-lg p-2 hover:bg-[#F9FBFD]"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF0000]" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CERTIFICATES */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0080C0] mb-5">
                Certificates
              </h3>
              <button
                type="button"
                onClick={addCertificate}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Certificate
              </button>
            </div>

            <div className="space-y-3">
              {formData.certificates.map((cert: any) => (
                <div key={cert.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <select
                    value={cert.name}
                    onChange={(e) => updateCertificate(cert.id, "name", e.target.value)}
                    className={inputStyle}
                  >
                    <option value="">Select Certificate</option>
                    {CERTIFICATES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    value={cert.number}
                    onChange={(e) => updateCertificate(cert.id, "number", e.target.value)}
                    className={inputStyle}
                    placeholder="Certificate No."
                  />
                  <input
                    type="date"
                    value={cert.dateIssued}
                    onChange={(e) => updateCertificate(cert.id, "dateIssued", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    type="date"
                    value={cert.validUntil}
                    onChange={(e) => updateCertificate(cert.id, "validUntil", e.target.value)}
                    className={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => removeCertificate(cert.id)}
                    className="flex items-center justify-center border border-[#D0E0F0] rounded-lg p-2 hover:bg-[#F9FBFD]"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF0000]" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* VESSEL EXPERIENCE */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0080C0] mb-5">
                Vessel Experience
              </h3>
              <button
                type="button"
                onClick={addVesselExperience}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" /> Add Vessel
              </button>
            </div>

            <div className="space-y-3">
              {formData.vesselExperience.map((v: any) => (
                <div key={v.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={v.manningCompany}
                    onChange={(e) => updateVesselExperience(v.id, "manningCompany", e.target.value)}
                    className={inputStyle}
                    placeholder="Manning Company"
                  />
                  <input
                    value={v.principal}
                    onChange={(e) => updateVesselExperience(v.id, "principal", e.target.value)}
                    className={inputStyle}
                    placeholder="Principal"
                  />
                  <input
                    value={v.rank}
                    onChange={(e) => updateVesselExperience(v.id, "rank", e.target.value)}
                    className={inputStyle}
                    placeholder="Rank"
                  />
                  <input
                    value={v.vesselName}
                    onChange={(e) => updateVesselExperience(v.id, "vesselName", e.target.value)}
                    className={inputStyle}
                    placeholder="Vessel Name"
                  />
                  <input
                    value={v.flag}
                    onChange={(e) => updateVesselExperience(v.id, "flag", e.target.value)}
                    className={inputStyle}
                    placeholder="Flag"
                  />
                  <input
                    value={v.vesselType}
                    onChange={(e) => updateVesselExperience(v.id, "vesselType", e.target.value)}
                    className={inputStyle}
                    placeholder="Vessel Type"
                  />
                  <input
                    value={v.grt}
                    onChange={(e) => updateVesselExperience(v.id, "grt", e.target.value)}
                    className={inputStyle}
                    placeholder="GRT"
                  />
                  <input
                    value={v.engineMaker}
                    onChange={(e) => updateVesselExperience(v.id, "engineMaker", e.target.value)}
                    className={inputStyle}
                    placeholder="Main Engine Maker"
                  />
                  <input
                    value={v.trading}
                    onChange={(e) => updateVesselExperience(v.id, "trading", e.target.value)}
                    className={inputStyle}
                    placeholder="Trading"
                  />
                  <input
                    value={v.route}
                    onChange={(e) => updateVesselExperience(v.id, "route", e.target.value)}
                    className={inputStyle}
                    placeholder="Route"
                  />
                  <input
                    type="date"
                    value={v.signedOn}
                    onChange={(e) => updateVesselExperience(v.id, "signedOn", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    type="date"
                    value={v.signedOff}
                    onChange={(e) => updateVesselExperience(v.id, "signedOff", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    value={v.causeOfDischarge}
                    onChange={(e) => updateVesselExperience(v.id, "causeOfDischarge", e.target.value)}
                    className={inputStyle}
                    placeholder="Cause of Discharge"
                  />
                  <button
                    type="button"
                    onClick={() => removeVesselExperience(v.id)}
                    className="flex items-center justify-center border border-[#D0E0F0] rounded-lg p-2 hover:bg-[#F9FBFD] col-span-3"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF0000]" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* REMARKS */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Remarks
            </h3>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              className={`${inputStyle} min-h-30 resize-none`}
              placeholder="Add remarks here..."
            />
          </section>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#0080C0] hover:bg-[#006BA0] text-white font-semibold rounded-lg py-3 transition"
            >
              {mode === "edit" ? "Update Crew Application" : "Submit Application"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#D0E0F0] text-[#0080C0] font-semibold rounded-lg py-3 hover:bg-[#F9FBFD] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
