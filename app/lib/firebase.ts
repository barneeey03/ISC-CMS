import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoepn-cFVxxcxCbXI0bMUmI_xLjVIJBtQ",
  authDomain: "isc-crewing.firebaseapp.com",
  projectId: "isc-crewing",
  storageBucket: "isc-crewing.firebasestorage.app",
  messagingSenderId: "515745062008",
  appId: "1:515745062008:web:d2bd8e9909218d8377a18d",
  measurementId: "G-8TRP6LC54D"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
