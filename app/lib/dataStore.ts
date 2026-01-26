import { CrewMember, Certificate, VesselExperience } from "./type";

class DataStore {
  private crews: Map<string, CrewMember> = new Map();
  private nextId = 1;

  addCrew(crew: Omit<CrewMember, "id" | "createdAt" | "status">): CrewMember {
    const id = `crew-${this.nextId++}`;

    const newCrew: CrewMember = {
      ...crew,
      id,
      createdAt: new Date().toISOString(),
      status: "pending",
      
      // Ensure all required fields have defaults
      certificates: crew.certificates || [],
      vesselExperience: crew.vesselExperience || [],
      documents: crew.documents || [],
      seaService: crew.seaService || [],
      
      medical: crew.medical || {
        certificateType: "",
        issuingClinic: "",
        dateIssued: "",
        expiryDate: "",
      },
      
      highSchool: crew.highSchool || { 
        schoolName: "", 
        yearGraduated: "" 
      },
      
      college: crew.college || { 
        schoolName: "", 
        course: "", 
        yearGraduated: "" 
      },
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
    if (!crew) return undefined;

    const updated = { ...crew, ...updates };
    this.crews.set(id, updated);
    return updated;
  }

  updateCrewStatus(
    id: string,
    status: CrewMember["status"]
  ): CrewMember | undefined {
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
export type { CrewMember, Certificate, VesselExperience };