export type Certificate = {
  id: string;
  name: string;
  number: string;
  dateIssued: string;
  validUntil: string;
};

export type VesselExperience = {
  expiryDate: string;
  id: string;
  manningCompany: string;
  principal: string;
  rank: string;
  vesselName: string;
  flag: string;
  vesselType: string;
  grt: string;
  engineMaker: string;
  trading: string;
  route: string;
  signedOn: string;
  signedOff: string;
  causeOfDischarge: string;
};

export interface CrewMember {
  [x: string]: any;
  rank: any;
  id: string;
  createdAt: string;
  dateApplied: string;
  presentRank: string;
  prevSalary: string;
  province: string;
  dateOfAvailability: string;
  expectedSalary: string;
  placeOfBirth: string;
  numOfChildren: string;
  religion: string;
  nextOfKin: string;
  nextOfKinAddress: string;
  schoolAttended: string;
  weight: string;
  course: string;
  yearGraduated: string;
  bmi: string;
  ishihara: string;

  certificates: Certificate[];
  vesselExperience: VesselExperience[];

  fullName: string;
  fathersName: string;
  mothersName: string;
  dateOfBirth: string;
  age: number;
  nationality: string;
  gender: string;
  height: string;
  uniformSize: string;
  civilStatus: string;

  mobileNumber: string;
  emailAddress: string;
  completeAddress: string;

  highSchool: {
    schoolName: string;
    yearGraduated: string;
  };

  college: {
    schoolName: string;
    course: string;
    yearGraduated: string;
  };

  documents: {
    id: string;
    name: string;
    placeIssued: string;
    dateIssued: string;
    expiryDate: string;
  }[];

  seaService: {
    id: string;
    rankServed: string;
    vesselName: string;
    vesselType: string;
    principal: string;
    dateOnboard: string;
    dateDisembarked: string;
    duration: string;
  }[];

  medical: {
    certificateType: string;
    issuingClinic: string;
    dateIssued: string;
    expiryDate: string;
  };

  vesselType: string;

  // ✅ NEW FIELDS
  vesselExperienceId?: string;
  vesselName?: string;
  principal?: string;
  expiryDate?: string;

  status: "pending" | "proposed" | "approved" | "disapproved" | "fooled" | "assigned";
  remarks: string;
}

class DataStore {
  [x: string]: any;
  private crews: Map<string, CrewMember> = new Map();
  private nextId = 1;

  addCrew(crew: Omit<CrewMember, "id" | "createdAt" | "status">): CrewMember {
    const id = `crew-${this.nextId++}`;

    // Provide default values for all required fields
    const newCrew: CrewMember = {
      ...crew,
      id,
      createdAt: new Date().toISOString(),
      status: "pending", // Default status
      rank: "", // Default empty string
      dateApplied: "", // Default empty string
      presentRank: "", // Default empty string
      prevSalary: "", // Default empty string
      province: "", // Default empty string
      dateOfAvailability: "", // Default empty string
      expectedSalary: "", // Default empty string
      placeOfBirth: "", // Default empty string
      numOfChildren: "", // Default empty string
      religion: "", // Default empty string
      nextOfKin: "", // Default empty string
      nextOfKinAddress: "", // Default empty string
      schoolAttended: "", // Default empty string
      weight: "", // Default empty string
      course: "", // Default empty string
      yearGraduated: "", // Default empty string
      bmi: "", // Default empty string
      ishihara: "", // Default empty string
      certificates: [], // Default empty array
      vesselExperience: [], // Default empty array
      fullName: "", // Default empty string
      fathersName: "", // Default empty string
      mothersName: "", // Default empty string
      dateOfBirth: "", // Default empty string
      age: 0, // Default to 0
      nationality: "", // Default empty string
      gender: "", // Default empty string
      height: "", // Default empty string
      uniformSize: "", // Default empty string
      civilStatus: "", // Default empty string
      mobileNumber: "", // Default empty string
      emailAddress: "", // Default empty string
      completeAddress: "", // Default empty string
      highSchool: { schoolName: "", yearGraduated: "" }, // Default empty object
      college: { schoolName: "", course: "", yearGraduated: "" }, // Default empty object
      documents: [], // Default empty array
      seaService: [], // Default empty array
      medical: { certificateType: "", issuingClinic: "", dateIssued: "", expiryDate: "" }, // Default empty object
      vesselType: "", // Default empty string
      remarks: "",
      vesselName: "",
      principal: ""
    };

    this.crews.set(id, newCrew);
    return newCrew;
  }

  getCrew(id: string): CrewMember | undefined {
    return this.crews.get(id);
  }

  getAllCrews(): CrewMember[] {
    return Array.from(this.crews.values());
  }

  updateCrew(id: string, updates: Partial<CrewMember>): CrewMember | undefined {
    const crew = this.crews.get(id);
    if (crew) {
      const updated = { ...crew, ...updates };
      this.crews.set(id, updated);
      return updated;
    }
    return undefined;
  }

  updateCrewStatus(id: string, status: CrewMember["status"]): CrewMember | undefined {
    const crew = this.crews.get(id);
    if (!crew) return undefined;

    const updatedCrew = { ...crew, status };
    this.crews.set(id, updatedCrew);
    return updatedCrew;
  }

  deleteCrew(id: string): boolean {
    return this.crews.delete(id);
  }
}

export const dataStore = new DataStore();
