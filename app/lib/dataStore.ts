import { CrewMember, Certificate, VesselExperience } from "./type";

class DataStore {
  [x: string]: any;
  private crews: Map<string, CrewMember> = new Map();
  private nextId = 1;

  addCrew(crew: Omit<CrewMember, "id" | "createdAt" | "status">): CrewMember {
    const id = `crew-${this.nextId++}`;

    const newCrew: CrewMember = {
      ...crew,
      id,
      createdAt: new Date().toISOString(),
      status: "pending",
      rank: "",
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
      age: 0,
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
      documents: [],
      seaService: [],
      medical: { certificateType: "", issuingClinic: "", dateIssued: "", expiryDate: "" },
      vesselType: "",
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
