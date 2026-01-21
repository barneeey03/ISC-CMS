// app/lib/dataStore.ts

export type Certificate = {
  id: string;
  name: string;
  number: string;
  dateIssued: string;
  validUntil: string;
};

export type VesselExperience = {
  id: string;
  manningCompany: string;
  principal: string;
  rank: string;
  vesselName: string;
  flag: string;
  vesselType: string;
  grt: string;         // <-- ADD THIS
  engineMaker: string;
  trading: string;
  route: string;
  signedOn: string;
  signedOff: string;
  causeOfDischarge: string;
};

export interface CrewMember {
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

  // ✅ UPDATED STATUS
  status: "proposed" | "approved" | "disapproved";

  // ✅ REMARKS ADDED
  remarks: string;
}

class DataStore {
  private crews: Map<string, CrewMember> = new Map();
  private nextId = 1;

  addCrew(crew: Omit<CrewMember, "id" | "createdAt">): CrewMember {
    const id = `crew-${this.nextId++}`;
    const newCrew: CrewMember = {
      ...crew,
      id,
      createdAt: new Date().toISOString(),
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

  deleteCrew(id: string): boolean {
    return this.crews.delete(id);
  }
}

export const dataStore = new DataStore();