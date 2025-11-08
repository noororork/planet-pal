import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClMNxRbr0aftnQdM1po3lBx6laVCtALVM",
  authDomain: "planet-pal-45bfd.firebaseapp.com",
  projectId: "planet-pal-45bfd",
  storageBucket: "planet-pal-45bfd.firebasestorage.app",
  messagingSenderId: "425454815161",
  appId: "1:425454815161:web:78edbf1b11a457d5279868"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);