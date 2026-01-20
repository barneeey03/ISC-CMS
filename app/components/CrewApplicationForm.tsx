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

  /* ✅ PREFILL WHEN EDITING */
  useEffect(() => {
    if (mode === "edit" && crew) {
      setFormData({
        fullName: crew.fullName,
        fathersName: crew.fathersName,
        mothersName: crew.mothersName,
        dateOfBirth: crew.dateOfBirth,
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
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "edit" && crew) {
      dataStore.updateCrew(crew.id, {
        ...formData,
        age: calculateAge(formData.dateOfBirth),
      });
    } else {
      const newCrew: Omit<CrewMember, "id" | "createdAt"> = {
        ...formData,
        age: calculateAge(formData.dateOfBirth),
        documents: [],
        seaService: [],
        medical: {
          certificateType: "",
          issuingClinic: "",
          dateIssued: "",
          expiryDate: "",
        },
        status: "pending",
      };

      dataStore.addCrew(newCrew);
    }

    onSuccess();
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E0E8F0] bg-white">
          <h2 className="text-2xl font-extrabold text-[#002060]">
            {mode === "edit" ? "Edit Crew Member" : "Add New Crew Member"}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-[#80A0C0] hover:text-[#002060]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Details */}
          <div>
            <h3 className="text-lg font-bold text-[#0080C0] mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <input
                type="text"
                name="fathersName"
                placeholder="Father's Name"
                value={formData.fathersName}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <input
                type="text"
                name="mothersName"
                placeholder="Mother's Name"
                value={formData.mothersName}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              >
                <option value="">Select Nationality</option>
                <option value="Filipino">Filipino</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Indian">Indian</option>
                <option value="Other">Other</option>
              </select>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input
                type="text"
                name="height"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
              <select
                name="uniformSize"
                value={formData.uniformSize}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              >
                <option value="">Select Uniform Size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
              <select
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>

          {/* Contact & Address */}
          <div>
            <h3 className="text-lg font-bold text-[#0080C0] mb-4">Contact & Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <input
                type="email"
                name="emailAddress"
                placeholder="Email Address"
                value={formData.emailAddress}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
              <input
                type="text"
                name="completeAddress"
                placeholder="Complete Address"
                value={formData.completeAddress}
                onChange={handleInputChange}
                className="col-span-2 px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
                required
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-bold text-[#0080C0] mb-4">Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="highSchool.schoolName"
                placeholder="High School Name"
                value={formData.highSchool.schoolName}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
              <input
                type="text"
                name="highSchool.yearGraduated"
                placeholder="Year Graduated"
                value={formData.highSchool.yearGraduated}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="college.schoolName"
                placeholder="College Name"
                value={formData.college.schoolName}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
              <input
                type="text"
                name="college.course"
                placeholder="Course"
                value={formData.college.course}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
              <input
                type="text"
                name="college.yearGraduated"
                placeholder="Year Graduated"
                value={formData.college.yearGraduated}
                onChange={handleInputChange}
                className="px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
              />
            </div>
          </div>

          {/* Vessel Type */}
          <div>
            <label className="block text-sm font-semibold text-[#002060] mb-2">
              Vessel Type
            </label>
            <input
              type="text"
              name="vesselType"
              placeholder="e.g., Container Ship, Tanker, Bulk Carrier"
              value={formData.vesselType}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-[#D0E0F0] bg-[#F9FBFD] text-[#002060] placeholder-[#80A0C0] focus:outline-none focus:ring-2 focus:ring-[#60A0C0] text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t border-[#E0E8F0]">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[#0080C0] hover:bg-[#006BA0] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Add Crew Member
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#D0E0F0] text-[#0080C0] font-semibold rounded-lg hover:bg-[#F9FBFD] transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
