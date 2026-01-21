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

// Update crew
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

// Delete crew
export async function deleteCrewFromFirestore(id: string) {
  const docRef = doc(db, "crewApplications", id);
  await deleteDoc(docRef);
}

// Get all crews
export async function getCrewApplications(): Promise<CrewMember[]> {
  const q = query(crewCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CrewMember, "id">),
  }));
}

// Get crew by ID
export async function getCrewById(id: string): Promise<CrewMember | null> {
  const docRef = doc(db, "crewApplications", id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<CrewMember, "id">),
  };
}

/* =========================
   🔥 REALTIME FIRESTORE LISTENER
   ========================= */

export function listenCrewApplications(
  callback: (data: CrewMember[]) => void
) {
  const q = query(crewCollection, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CrewMember, "id">),
    }));

    callback(data);
  });

  return unsubscribe;
}
