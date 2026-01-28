import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  getDoc,
  onSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

import { db } from "./firebase";
import { CrewMember } from "./dataStore";

const crewCollection = collection(db, "crewApplications");
const crewDatabaseCollection = collection(db, "crewDatabase"); // <-- NEW

// Add crew
export async function addCrewToFirestore(
  payload: Omit<CrewMember, "id" | "createdAt">
) {
  const docRef = await addDoc(crewCollection, {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Add crew to crewDatabase (NEW)
export async function addCrewToDatabaseFirestore(
  id: string,
  payload: Omit<CrewMember, "id" | "createdAt">
) {
  await setDoc(doc(db, "crewDatabase", id), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

// Update crew in crewApplications
export async function updateCrewInFirestore(
  id: string,
  payload: Partial<Omit<CrewMember, "id" | "createdAt">>
) {
  const docRef = doc(db, "crewApplications", id);

  // Remove undefined values
  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );

  await updateDoc(docRef, cleanedPayload);
}

// Update crew in crewDatabase (NEW)
export async function updateCrewDatabaseInFirestore(
  id: string,
  payload: Partial<Omit<CrewMember, "id" | "createdAt">>
) {
  const docRef = doc(db, "crewDatabase", id);

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );

  // 🔥 Use setDoc merge so it won't fail if doc doesn't exist
  await setDoc(docRef, cleanedPayload, { merge: true });
}


// Delete crew from crewApplications
export async function deleteCrewFromFirestore(id: string) {
  const docRef = doc(db, "crewApplications", id);
  await deleteDoc(docRef);
}

// Get all crew applications
export async function getCrewApplications(): Promise<CrewMember[]> {
  const q = query(crewCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const docData = doc.data() as Omit<CrewMember, "id">;

    const crewMember: CrewMember = {
      id: doc.id,
      rank: docData.rank ?? "",
      createdAt: docData.createdAt ?? new Date().toISOString(),
      dateApplied: docData.dateApplied ?? "",
      presentRank: docData.presentRank ?? "",
      prevSalary: docData.prevSalary ?? "",
      province: docData.province ?? "",
      dateOfAvailability: docData.dateOfAvailability ?? "",
      expectedSalary: docData.expectedSalary ?? "",
      placeOfBirth: docData.placeOfBirth ?? "",
      numOfChildren: docData.numOfChildren ?? "",
      religion: docData.religion ?? "",
      nextOfKin: docData.nextOfKin ?? "",
      nextOfKinAddress: docData.nextOfKinAddress ?? "",
      schoolAttended: docData.schoolAttended ?? "",
      weight: docData.weight ?? "",
      course: docData.course ?? "",
      yearGraduated: docData.yearGraduated ?? "",
      bmi: docData.bmi ?? "",
      ishihara: docData.ishihara ?? "",
      certificates: docData.certificates ?? [],
      vesselExperience: docData.vesselExperience ?? [],
      fullName: docData.fullName ?? "",
      fathersName: docData.fathersName ?? "",
      mothersName: docData.mothersName ?? "",
      dateOfBirth: docData.dateOfBirth ?? "",
      age: docData.age ?? 0,
      nationality: docData.nationality ?? "",
      gender: docData.gender ?? "",
      height: docData.height ?? "",
      uniformSize: docData.uniformSize ?? "",
      civilStatus: docData.civilStatus ?? "",
      mobileNumber: docData.mobileNumber ?? "",
      emailAddress: docData.emailAddress ?? "",
      completeAddress: docData.completeAddress ?? "",
      highSchool: docData.highSchool ?? { schoolName: "", yearGraduated: "" },
      college: docData.college ?? { schoolName: "", course: "", yearGraduated: "" },
      documents: docData.documents ?? [],
      seaService: docData.seaService ?? [],
      medical: docData.medical ?? { certificateType: "", issuingClinic: "", dateIssued: "", expiryDate: "" },
      vesselType: docData.vesselType ?? "",
      status: docData.status ?? "pending",
      remarks: docData.remarks ?? "",
      vesselName: "",
      principal: "",
      medicals: undefined
    };

    return crewMember;
  });
}

// Get crew database (NEW)
export async function getCrewDatabase(): Promise<CrewMember[]> {
  const q = query(crewDatabaseCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as any),
  })) as CrewMember[];
}

// Real-time Firestore Listener
export function listenCrewApplications(callback: (data: CrewMember[]) => void) {
  const q = query(crewCollection, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc) => {
      const docData = doc.data() as Omit<CrewMember, "id">;

      const crewMember: CrewMember = {
        id: doc.id,
        rank: docData.rank ?? "",
        createdAt: docData.createdAt ?? new Date().toISOString(),
        dateApplied: docData.dateApplied ?? "",
        presentRank: docData.presentRank ?? "",
        prevSalary: docData.prevSalary ?? "",
        province: docData.province ?? "",
        dateOfAvailability: docData.dateOfAvailability ?? "",
        expectedSalary: docData.expectedSalary ?? "",
        placeOfBirth: docData.placeOfBirth ?? "",
        numOfChildren: docData.numOfChildren ?? "",
        religion: docData.religion ?? "",
        nextOfKin: docData.nextOfKin ?? "",
        nextOfKinAddress: docData.nextOfKinAddress ?? "",
        schoolAttended: docData.schoolAttended ?? "",
        weight: docData.weight ?? "",
        course: docData.course ?? "",
        yearGraduated: docData.yearGraduated ?? "",
        bmi: docData.bmi ?? "",
        ishihara: docData.ishihara ?? "",
        certificates: docData.certificates ?? [],
        vesselExperience: docData.vesselExperience ?? [],
        fullName: docData.fullName ?? "",
        fathersName: docData.fathersName ?? "",
        mothersName: docData.mothersName ?? "",
        dateOfBirth: docData.dateOfBirth ?? "",
        age: docData.age ?? 0,
        nationality: docData.nationality ?? "",
        gender: docData.gender ?? "",
        height: docData.height ?? "",
        uniformSize: docData.uniformSize ?? "",
        civilStatus: docData.civilStatus ?? "",
        mobileNumber: docData.mobileNumber ?? "",
        emailAddress: docData.emailAddress ?? "",
        completeAddress: docData.completeAddress ?? "",
        highSchool: docData.highSchool ?? { schoolName: "", yearGraduated: "" },
        college: docData.college ?? { schoolName: "", course: "", yearGraduated: "" },
        documents: docData.documents ?? [],
        seaService: docData.seaService ?? [],
        medical: docData.medical ?? { certificateType: "", issuingClinic: "", dateIssued: "", expiryDate: "" },
        vesselType: docData.vesselType ?? "",
        status: docData.status ?? "pending",
        remarks: docData.remarks ?? "",
        vesselName: "",
        principal: "",
        medicals: undefined
      };

      return crewMember;
    });

    callback(data);
  });

  return unsubscribe;
}
