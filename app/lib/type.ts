export type CrewMemberStatus =
  | "pending"
  | "proposed"
  | "approved"
  | "disapproved"
  | "fooled"
  | "assigned";

export type Certificate = {
  id: string;
  name: string;
  number: string;
  dateIssued: string;
  validUntil: string;
  placeIssued: string;      
  trainingCenter: string;
};

export type VesselExperience = {
  id: string;
  assignmentId?: string;
  manningCompany: string;
  principal: string;
  rank: string;
  vesselName: string;
  flag: string;
  vesselType: string;
  grt: string;
  mainEngine: string;
  tradingRoute: string;
  signedOn: string;
  signedOff: string;
  causeOfDischarge: string;
};

export interface CrewMember {
  // System fields
  id: string;
  createdAt: string;
  status: CrewMemberStatus;

  // Application Information
  dateApplied: string;
  presentRank: string;
  prevSalary: string;
  province: string; // Position Applied For
  dateOfAvailability: string;
  expectedSalary: string;

  // Personal Details
  fullName: string;
  dateOfBirth: string;
  age: number;
  placeOfBirth: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  mobileNumber: string;
  emailAddress: string;
  completeAddress: string;
  numOfChildren: string;
  religion: string;
  uniformSize: string;

  // Family Information
  fathersName: string;
  mothersName: string;
  nextOfKin: string;
  nextOfKinAddress: string;

  // Education
  schoolAttended: string;
  course: string;
  yearGraduated: string;
  highSchool: {
    schoolName: string;
    yearGraduated: string;
  };
  college: {
    schoolName: string;
    course: string;
    yearGraduated: string;
  };

  // Office Use Only
  height: string;
  weight: string;
  bmi: string;
  ishihara: string;

  // Documents
  documents: {
    id: string;
    name: string;
    placeIssued: string; // Document No.
    dateIssued: string;
    expiryDate: string;
  }[];

  // Certificates
  certificates: Certificate[];

  // Vessel Experience
  vesselExperience: VesselExperience[];

  // Sea Service (if different from vessel experience)
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

  // Additional fields
  rank: string;
  vesselType: string;
  remarks: string;

  // Legacy/optional fields
  vesselExperienceId?: string;
  vesselName?: string;
  principal?: string;
  expiryDate?: string;
}