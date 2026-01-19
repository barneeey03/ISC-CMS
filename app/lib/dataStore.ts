// In-memory data store
export interface CrewMember {
  id: string;
  // Profile
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
  // Contact & Address
  mobileNumber: string;
  emailAddress: string;
  completeAddress: string;
  // Education
  highSchool: {
    schoolName: string;
    yearGraduated: string;
  };
  college: {
    schoolName: string;
    course: string;
    yearGraduated: string;
  };
  // Documents
  documents: {
    id: string;
    name: string;
    placeIssued: string;
    dateIssued: string;
    expiryDate: string;
  }[];
  // Sea Service
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
  // Medical
  medical: {
    certificateType: string;
    issuingClinic: string;
    dateIssued: string;
    expiryDate: string;
  };
  vesselType: string;
  // Status
  status: "pending" | "approved" | "disapproved";
  createdAt: string;
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

  getCrewsByStatus(status: CrewMember["status"]): CrewMember[] {
    return Array.from(this.crews.values()).filter((crew) => crew.status === status);
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

// Singleton instance
export const dataStore = new DataStore();
