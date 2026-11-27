// Firebase (web) client for `realf` — backend = original `Golden-Cares-App` project.
// Source of truth: ~/code room/Golden-Cares-App/lib/firebase_options.dart + production_instances.dart
//   projectId golden-care-d4863, authDomain goldencares.in,
//   storageBucket golden-care-d4863.firebasestorage.app,
//   Firestore named database `production-mumbai`, Cloud Functions region `asia-south1`.
// Nothing Base44 here. Override per-env with VITE_FIREBASE_*.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

const env = (key, fallback) => {
  const v = import.meta.env?.[key];
  return v === undefined || v === null || v === "" ? fallback : v;
};

// Web config values are public identifiers (they ship in every Flutter web / web build);
// secrets (service accounts, admin keys, Razorpay/PayU) are NOT here. Override with VITE_FIREBASE_*.
export const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY", ""),
  appId: env("VITE_FIREBASE_APP_ID", "1:143097198020:web:1bfefba8807c95495b2091"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID", "143097198020"),
  projectId: env("VITE_FIREBASE_PROJECT_ID", "golden-care-d4863"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN", "goldencares.in"),
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET", "golden-care-d4863.firebasestorage.app"),
  measurementId: env("VITE_FIREBASE_MEASUREMENT_ID", "G-1E46FR6MEM"),
};

// Firestore lives in a NAMED database `production-mumbai`, not `(default)`.
export const FIRESTORE_DATABASE_ID = env("VITE_FIRESTORE_DATABASE_ID", "production-mumbai");
// Cloud Functions for this project are deployed to asia-south1 only.
export const FUNCTIONS_REGION = env("VITE_FUNCTIONS_REGION", "asia-south1");

let _app;
export function getFirebaseApp() {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

let _db;
export function getDb() {
  if (_db) return _db;
  const app = getFirebaseApp();
  // initializeFirestore(target db) once; fall back to getFirestore.
  try {
    _db = initializeFirestore(app, {}, FIRESTORE_DATABASE_ID);
  } catch {
    _db = getFirestore(app, FIRESTORE_DATABASE_ID);
  }
  return _db;
}

export const auth = () => getAuth(getFirebaseApp());
// Alias used by the admin session layer.
export const getAuthClient = auth;
export const storage = () => getStorage(getFirebaseApp());
export const functions = () => getFunctions(getFirebaseApp(), FUNCTIONS_REGION);

/** httpsCallable wrapper matching original Golden-Cares-App `cloud_functions`. */
export function callFunction(name, data) {
  return httpsCallable(functions(), name)(data ?? {});
}

let _analytics;
export async function analytics() {
  try {
    if (!(await analyticsSupported())) return null;
    _analytics ??= getAnalytics(getFirebaseApp());
    return _analytics;
  } catch {
    return null;
  }
}

// Match original `productionFirestore` / `productionFunctions`.
export const productionFirestore = () => getDb();
export const productionFunctions = () => functions();
