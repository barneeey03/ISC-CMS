export type CrewMemberStatus =
  | "pending"
  | "passed"
  | "failed"
  | "approved"
  | "disapproved"
  | "proposed"
  | "on-hold"
  | "pooled"
  | "assigned";

export type Certificate = {
  certificateName: string;
  certificateNumber: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  id: string;
  name: string;
  number: string;
  documentNo: string;
  certificateNo: string;
  referenceNo: string;
  dateIssued: string;
  expiryDate: string; // ✅ Changed from function to string
  validUntil: string;
  placeIssued: string;      
  trainingCenter: string;
  expiry: string;
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
  duration: string; // ✅ Changed from union type to just string
};

export interface CrewMember {
  shoeSize: string;
  nearestAirport: string;
  overallSize: string;
  maritalStatus: string;
  education: never[];
  documentStatus: string;
  medicals: any;
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
    documentNo: any;
    number: any;
    referenceNo: any;
    id: string;
    name: string;
    placeIssued: string; // This is labeled as "Document No." in comment
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