"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Certificate,
  CrewMember,
  VesselExperience,
} from "@/app/lib/type";
import { addCrewToFirestore, updateCrewInFirestore } from "@/app/lib/crewservice";
import { serverTimestamp } from "firebase/firestore";

// Form-friendly types
type Medical = {
  name?: string;
  type?: string;
  medicalType?: string;
  certificateType: string;
  issuingClinic: string;
  dateIssued: string;
  expiryDate: string;
};

type FormCertificate = {
  id: string;
  name: string;
  number?: string;
  documentNo?: string;
  referenceNo?: string;
  placeIssued?: string;
  trainingCenter?: string;
  dateIssued?: string;
  expiryDate: string;
  expiry?: string;
};

type FormDocument = {
  id: string;
  name: string;
  placeIssued?: string;
  documentNo?: string;
  number?: string;
  referenceNo?: string;
  dateIssued?: string;
  expiryDate?: string;
};

type CrewFormData = Omit<
  CrewMember,
  "id" | "createdAt" | "age" | "medicals" | "certificates" | "documents"
> & {
  age: string;
  medicals: Medical[];
  medical: Medical;
  certificates: FormCertificate[];
  documents: FormDocument[];
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
    // System fields
    status: "pending",

    // Application Information
    dateApplied: "",
    presentRank: "",
    prevSalary: "",
    province: "",
    dateOfAvailability: "",
    expectedSalary: "",

    // Personal Details
    fullName: "",
    dateOfBirth: "",
    age: "",
    placeOfBirth: "",
    gender: "",
    civilStatus: "",
    nationality: "",
    mobileNumber: "",
    emailAddress: "",
    completeAddress: "",
    numOfChildren: "",
    religion: "",
    uniformSize: "",

    // Family Information
    fathersName: "",
    mothersName: "",
    nextOfKin: "",
    nextOfKinAddress: "",

    // Education
    schoolAttended: "",
    course: "",
    yearGraduated: "",
    highSchool: { schoolName: "", yearGraduated: "" },
    college: { schoolName: "", course: "", yearGraduated: "" },

    // Office Use Only
    height: "",
    weight: "",
    bmi: "",
    ishihara: "",

    // Documents - ✅ FIXED: Now includes documentNo field
    documents: [
      {
        id: `doc-${Date.now()}`,
        name: "",
        documentNo: "",
        placeIssued: "",
        number: "",
        referenceNo: "",
        dateIssued: "",
        expiryDate: "",
      },
    ],

    // Certificates
    certificates: [],

    // Vessel Experience
    vesselExperience: [],

    // Sea Service
    seaService: [],

    // Medical - ✅ FIXED: Added all necessary fields
    medical: {
      name: "",
      type: "",
      medicalType: "",
      certificateType: "",
      issuingClinic: "",
      dateIssued: "",
      expiryDate: "",
    },

    // Medicals array for Firestore
    medicals: [],

    // Additional fields
    rank: "",
    vesselType: "",
    remarks: "",
  });

  useEffect(() => {
    if (mode === "edit" && crew) {
      setFormData((prev) => ({
        ...prev,
        ...crew,
        age: crew.age ? String(crew.age) : "",
        certificates:
          crew.certificates?.map((c) => ({
            id: c.id || `cert-${Date.now()}-${Math.random()}`,
            name: c.name || "",
            number: c.number || "",
            documentNo: c.documentNo || c.number || "",
            referenceNo: c.referenceNo || "",
            placeIssued: c.placeIssued || "",
            trainingCenter: c.trainingCenter || "",
            dateIssued: c.dateIssued || "",
            expiryDate: c.expiryDate || "",
            expiry: c.expiry || "",
          })) || [],
        documents: crew.documents?.map((d) => ({
          id: d.id || `doc-${Date.now()}-${Math.random()}`,
          name: d.name || "",
          documentNo: d.documentNo || d.placeIssued || d.number || "",
          placeIssued: d.placeIssued || "",
          number: d.number || "",
          referenceNo: d.referenceNo || "",
          dateIssued: d.dateIssued || "",
          expiryDate: d.expiryDate || "",
        })) || prev.documents,
        medical: crew.medicals?.[0] ? {
          name: crew.medicals[0].name || "",
          type: crew.medicals[0].type || "",
          medicalType: crew.medicals[0].medicalType || "",
          certificateType: crew.medicals[0].certificateType || "",
          issuingClinic: crew.medicals[0].issuingClinic || "",
          dateIssued: crew.medicals[0].dateIssued || "",
          expiryDate: crew.medicals[0].expiryDate || "",
        } : prev.medical,
        medicals: crew.medicals || prev.medicals,
        vesselExperience: 
          crew.vesselExperience?.map((v) => ({
            ...v,
            duration: typeof v.duration === "function" ? "" : v.duration || "",
          })) || [],
        highSchool: crew.highSchool || prev.highSchool,
        college: crew.college || prev.college,
        seaService: crew.seaService || prev.seaService,
      }));
    }
  }, [mode, crew]);

  // Age calculation
  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return String(age);
  };

  // Generic input handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

  // Certificates
  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          id: `cert-${Date.now()}-${Math.random()}`,
          name: "",
          number: "",
          documentNo: "",
          referenceNo: "",
          placeIssued: "",
          trainingCenter: "",
          dateIssued: "",
          expiryDate: "",
          expiry: "",
        },
      ],
    }));
  };

  const removeCertificate = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((c) => c.id !== id),
    }));
  };

  const updateCertificate = (id: string, field: keyof FormCertificate, value: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // Documents - ✅ FIXED: Now properly handles documentNo
  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        { 
          id: `doc-${Date.now()}-${Math.random()}`, 
          name: "", 
          documentNo: "",
          placeIssued: "", 
          number: "",
          referenceNo: "",
          dateIssued: "", 
          expiryDate: "" 
        },
      ],
    }));
  };

  const removeDocument = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }));
  };

  const updateDocument = (
    id: string,
    field: keyof FormDocument,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    }));
  };

  // Vessel Experience
  const addVesselExperience = () => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: [
        ...prev.vesselExperience,
        {
          id: `vexp-${Date.now()}-${Math.random()}`,
          assignmentId: "",
          manningCompany: "",
          principal: "",
          rank: "",
          vesselName: "",
          flag: "",
          vesselType: "",
          grt: "",
          mainEngine: "",
          tradingRoute: "",
          signedOn: "",
          signedOff: "",
          causeOfDischarge: "",
          duration: "",
        },
      ],
    }));
  };

  const removeVesselExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: prev.vesselExperience.filter((v) => v.id !== id),
    }));
  };

  const updateVesselExperience = (id: string, field: keyof VesselExperience, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vesselExperience: prev.vesselExperience.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const sortVesselExperienceLatestFirst = (vessels: VesselExperience[]) =>
    [...vessels].sort((a, b) => {
      const aDate = a.signedOn ? new Date(a.signedOn).getTime() : 0;
      const bDate = b.signedOn ? new Date(b.signedOn).getTime() : 0;
      return bDate - aDate;
    });

  // Submit - ✅ FIXED: Properly structures all data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sortedVesselExperience = sortVesselExperienceLatestFirst(formData.vesselExperience);

    // ✅ FIXED: Ensure medical data has all necessary fields
    const medicalWithAllFields = {
      ...formData.medical,
      name: formData.medical.certificateType || formData.medical.name || "PEME",
      type: formData.medical.certificateType || formData.medical.type || "PEME",
      medicalType: formData.medical.certificateType || formData.medical.medicalType || "PEME",
    };

    const payload: CrewMember = {
      ...formData,
      age: Number(formData.age),
      vesselExperience: sortedVesselExperience,
      medicals: [medicalWithAllFields],
      certificates: formData.certificates.map((c) => ({
        ...c,
        documentNo: c.documentNo || c.number || "",
        expiryDate: c.expiryDate || "",
      })),
      documents: formData.documents.map((d) => ({
        ...d,
        documentNo: d.documentNo || d.placeIssued || d.number || "",
        expiryDate: d.expiryDate || "",
      })),
      createdAt: serverTimestamp() as any,
    } as unknown as CrewMember;

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
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#E0E8F0] bg-white">
          <h2 className="text-2xl font-extrabold text-[#002060]">
            {mode === "edit" ? "Edit Crew Application" : "Crew Application Form"}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-[#80A0C0] hover:text-[#002060]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* APPLICATION INFORMATION */}
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

          {/* PERSONAL DETAILS */}
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

          {/* FAMILY INFORMATION */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Family Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="fathersName"
                value={formData.fathersName}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Father's Name"
              />
              <input
                name="mothersName"
                value={formData.mothersName}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Mother's Name"
              />
              <input
                name="nextOfKin"
                value={formData.nextOfKin}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Next of Kin / Relationship"
              />
              <input
                name="nextOfKinAddress"
                value={formData.nextOfKinAddress}
                onChange={handleInputChange}
                required
                className={inputStyle}
                placeholder="Next of Kin Address"
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

          {/* DOCUMENTS - ✅ FIXED: Now includes documentNo field */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0080C0]">
                Documents
              </h3>
              <button
                type="button"
                onClick={addDocument}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg hover:bg-[#006BA0] transition"
              >
                <Plus className="w-4 h-4" /> Add Document
              </button>
            </div>

            <div className="space-y-3">
              {formData.documents.map((doc) => (
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
                    value={doc.documentNo || doc.placeIssued || ""}
                    onChange={(e) =>
                      updateDocument(doc.id, "documentNo", e.target.value)
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
                    className="flex items-center justify-center border border-[#D0E0F0] rounded-lg p-2 hover:bg-[#F9FBFD] transition"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF0000]" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* MEDICAL CERTIFICATE - ✅ FIXED: Added all field mappings */}
          <section className="border border-[#E0E8F0] rounded-xl p-6 bg-[#F9FBFD]">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Medical Certificate
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                name="medical.certificateType"
                value={formData.medical.certificateType}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Certificate Type (e.g. PEME, Seafarer Medical)"
                required
              />

              <input
                name="medical.issuingClinic"
                value={formData.medical.issuingClinic}
                onChange={handleInputChange}
                className={inputStyle}
                placeholder="Issuing Clinic / Hospital"
                required
              />

              <input
                type="date"
                name="medical.dateIssued"
                value={formData.medical.dateIssued}
                onChange={handleInputChange}
                className={inputStyle}
                required
              />

              <input
                type="date"
                name="medical.expiryDate"
                value={formData.medical.expiryDate}
                onChange={handleInputChange}
                className={inputStyle}
                required
              />
            </div>
          </section>

          {/* CERTIFICATES */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0080C0]">Certificates</h3>
              <button
                type="button"
                onClick={addCertificate}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg hover:bg-[#006BA0] transition"
              >
                <Plus className="w-4 h-4" /> Add Certificate
              </button>
            </div>

            <div className="space-y-3">
              {formData.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end"
                >
                  <select
                    value={cert.name}
                    onChange={(e) =>
                      updateCertificate(cert.id, "name", e.target.value)
                    }
                    className={inputStyle}
                  >
                    <option value="">Certificate</option>
                    {CERTIFICATES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <input
                    className={inputStyle}
                    placeholder="Certificate No."
                    value={cert.number || cert.documentNo || ""}
                    onChange={(e) =>
                      updateCertificate(cert.id, "number", e.target.value)
                    }
                  />

                  <input
                    className={inputStyle}
                    placeholder="Place Issued"
                    value={cert.placeIssued}
                    onChange={(e) =>
                      updateCertificate(cert.id, "placeIssued", e.target.value)
                    }
                  />

                  <input
                    className={inputStyle}
                    placeholder="Training Center"
                    value={cert.trainingCenter}
                    onChange={(e) =>
                      updateCertificate(cert.id, "trainingCenter", e.target.value)
                    }
                  />

                  <input
                    type="date"
                    className={inputStyle}
                    value={cert.dateIssued}
                    onChange={(e) =>
                      updateCertificate(cert.id, "dateIssued", e.target.value)
                    }
                  />

                  <input
                    type="date"
                    className={inputStyle}
                    value={cert.expiryDate}
                    onChange={(e) =>
                      updateCertificate(cert.id, "expiryDate", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeCertificate(cert.id)}
                    className="flex items-center justify-center border border-[#D0E0F0] rounded-lg p-2 hover:bg-[#F9FBFD] transition"
                  >
                    <Trash2 className="w-4 h-4 text-[#FF0000]" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* VESSEL EXPERIENCE */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0080C0]">
                Vessel Experience
              </h3>
              <button
                type="button"
                onClick={addVesselExperience}
                className="flex items-center gap-2 bg-[#0080C0] text-white px-4 py-2 rounded-lg hover:bg-[#006BA0] transition"
              >
                <Plus className="w-4 h-4" /> Add Vessel
              </button>
            </div>

            <div className="space-y-6">
              {formData.vesselExperience.map((v) => (
                <div key={v.id} className="border border-[#E0E8F0] rounded-lg p-4 bg-[#F9FBFD]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={v.manningCompany}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "manningCompany", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Manning Company"
                    />
                    <input
                      value={v.principal}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "principal", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Principal"
                    />
                    <input
                      value={v.rank}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "rank", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Rank"
                    />
                    <input
                      value={v.vesselName}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "vesselName", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Vessel Name"
                    />
                    <input
                      value={v.flag}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "flag", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Flag"
                    />
                    <input
                      value={v.vesselType}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "vesselType", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Vessel Type"
                    />
                    <input
                      value={v.grt}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "grt", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="GRT"
                    />
                    <input
                      value={v.mainEngine}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "mainEngine", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Main Engine"
                    />
                    <input
                      value={v.tradingRoute}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "tradingRoute", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Trading Route"
                    />
                    <input
                      type="date"
                      value={v.signedOn}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "signedOn", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Signed On"
                    />
                    <input
                      type="date"
                      value={v.signedOff}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "signedOff", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Signed Off"
                    />
                    <input
                      value={v.causeOfDischarge}
                      onChange={(e) =>
                        updateVesselExperience(v.id, "causeOfDischarge", e.target.value)
                      }
                      className={inputStyle}
                      placeholder="Cause of Discharge"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVesselExperience(v.id)}
                    className="mt-3 flex items-center gap-2 text-[#FF0000] hover:text-[#CC0000] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Vessel
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
              className={`${inputStyle} min-h-25 resize-none`}
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