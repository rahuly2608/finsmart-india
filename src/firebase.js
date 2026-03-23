
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBvK782QrS-dYcgkbcUWmlzMiTZcDnP2uY",
  authDomain: "finsmart-india.firebaseapp.com",
  projectId: "finsmart-india",
  storageBucket: "finsmart-india.firebasestorage.app",
  messagingSenderId: "327953029314",
  appId: "1:327953029314:web:3d8988462caf064626835b"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
