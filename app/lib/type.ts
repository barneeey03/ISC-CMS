export type CrewMemberStatus = "pending" | "proposed" | "approved" | "disapproved";

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
  grt: string;
  engineMaker: string;
  trading: string;
  route: string;
  signedOn: string;
  signedOff: string;
  causeOfDischarge: string;
};

export interface CrewMember {
  rank: string;
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

  status: CrewMemberStatus;
  remarks: string;
}
