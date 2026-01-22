import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const getVesselExperiences = async () => {
  const snapshot = await getDocs(collection(db, "vesselExperiences"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
