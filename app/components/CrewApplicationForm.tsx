"use client";

import React, { useState, useEffect } from "react";
import { dataStore, CrewMember } from "@/app/lib/dataStore";
import { X } from "lucide-react";

interface CrewApplicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  mode?: "add" | "edit";
  crew?: CrewMember;
}

const inputStyle =
  "px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm transition";

export function CrewApplicationForm({
  onClose,
  onSuccess,
  mode = "add",
  crew,
}: CrewApplicationFormProps) {
  const [formData, setFormData] = useState({
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
    vesselType: "",
  });

  /* PREFILL WHEN EDITING */
  useEffect(() => {
    if (mode === "edit" && crew) {
      setFormData({
        fullName: crew.fullName,
        fathersName: crew.fathersName,
        mothersName: crew.mothersName,
        dateOfBirth: crew.dateOfBirth,
        age: String(crew.age ?? ""),
        nationality: crew.nationality,
        gender: crew.gender,
        height: crew.height,
        uniformSize: crew.uniformSize,
        civilStatus: crew.civilStatus,
        mobileNumber: crew.mobileNumber,
        emailAddress: crew.emailAddress,
        completeAddress: crew.completeAddress,
        highSchool: crew.highSchool,
        college: crew.college,
        vesselType: crew.vesselType,
      });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      age: Number(calculateAge(formData.dateOfBirth)),
    };

    if (mode === "edit" && crew) {
      dataStore.updateCrew(crew.id, payload);
    } else {
      dataStore.addCrew({
        ...payload,
        documents: [],
        seaService: [],
        medical: {
          certificateType: "",
          issuingClinic: "",
          dateIssued: "",
          expiryDate: "",
        },
        status: "pending",
      });
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[#E0E8F0] bg-white">
          <h2 className="text-2xl font-extrabold text-[#002060]">
            {mode === "edit" ? "Edit Crew Member" : "Add New Crew Member"}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-[#80A0C0] hover:text-[#002060]" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* PERSONAL DETAILS */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Personal Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} required className={inputStyle} />
              <input name="fathersName" placeholder="Father's Name" value={formData.fathersName} onChange={handleInputChange} required className={inputStyle} />
              <input name="mothersName" placeholder="Mother's Name" value={formData.mothersName} onChange={handleInputChange} required className={inputStyle} />

              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required className={inputStyle} />

              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                readOnly
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#EEF4FA] text-[#002060] cursor-not-allowed text-sm"
              />

              <select name="nationality" value={formData.nationality} onChange={handleInputChange} required className={inputStyle}>
                <option value="">Select Nationality</option>
                <option value="Filipino">Filipino</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>

              <select name="gender" value={formData.gender} onChange={handleInputChange} required className={inputStyle}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <input name="height" placeholder="Height (cm)" value={formData.height} onChange={handleInputChange} className={inputStyle} />

              <select name="uniformSize" value={formData.uniformSize} onChange={handleInputChange} className={inputStyle}>
                <option value="">Uniform Size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>

              <select name="civilStatus" value={formData.civilStatus} onChange={handleInputChange} className={inputStyle}>
                <option value="">Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </section>

          {/* CONTACT */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Contact & Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="mobileNumber" placeholder="Mobile Number" value={formData.mobileNumber} onChange={handleInputChange} required className={inputStyle} />
              <input name="emailAddress" placeholder="Email Address" value={formData.emailAddress} onChange={handleInputChange} required className={inputStyle} />
              <input name="completeAddress" placeholder="Complete Address" value={formData.completeAddress} onChange={handleInputChange} required className={`md:col-span-2 ${inputStyle}`} />
            </div>
          </section>

          {/* EDUCATION */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0080C0] mb-5">
              Education
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input name="highSchool.schoolName" placeholder="High School Name" value={formData.highSchool.schoolName} onChange={handleInputChange} className={inputStyle} />
              <input name="highSchool.yearGraduated" placeholder="Year Graduated" value={formData.highSchool.yearGraduated} onChange={handleInputChange} className={inputStyle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="college.schoolName" placeholder="College Name" value={formData.college.schoolName} onChange={handleInputChange} className={inputStyle} />
              <input name="college.course" placeholder="Course" value={formData.college.course} onChange={handleInputChange} className={inputStyle} />
              <input name="college.yearGraduated" placeholder="Year Graduated" value={formData.college.yearGraduated} onChange={handleInputChange} className={inputStyle} />
            </div>
          </section>

          {/* VESSEL */}
          <section className="border border-[#E0E8F0] rounded-xl p-6">
            <label className="block text-sm font-semibold text-[#002060] mb-2">
              Vessel Type
            </label>
            <input name="vesselType" placeholder="e.g. Container Ship, Tanker" value={formData.vesselType} onChange={handleInputChange} className={inputStyle} />
          </section>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-4">
            <button type="submit" className="flex-1 bg-[#0080C0] hover:bg-[#006BA0] text-white font-semibold rounded-lg py-3 transition">
              {mode === "edit" ? "Update Crew Member" : "Add Crew Member"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-[#D0E0F0] text-[#0080C0] font-semibold rounded-lg py-3 hover:bg-[#F9FBFD] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
