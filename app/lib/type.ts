export type CrewMemberStatus = "pending" | "approved" | "disapproved";

export interface CrewMember {
  id: string;
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
  highSchool: { schoolName: string; yearGraduated: string };
  college: { schoolName: string; course: string; yearGraduated: string };
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
  status: CrewMemberStatus;
  createdAt: string;
}
