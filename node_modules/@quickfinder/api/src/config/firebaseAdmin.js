/**
 * Firebase Admin SDK Initialization (Backend)
 * Project: quick--finder
 * Supports loading service account via:
 * 1. FIREBASE_SERVICE_ACCOUNT env variable (JSON string)
 * 2. FIREBASE_SERVICE_ACCOUNT_BASE64 env variable (Base64 string)
 * 3. Local JSON file at config.firebaseServiceAccountPath
 */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');
const config = require('../config');

const FIREBASE_DB_URL = 'https://quick--finder-default-rtdb.asia-southeast1.firebasedatabase.app';

function getServiceAccountCredentials() {
  // Option 1: FIREBASE_SERVICE_ACCOUNT env variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
    } catch (err) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    }
  }

  // Option 2: FIREBASE_SERVICE_ACCOUNT_BASE64 env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (err) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_BASE64 env var:', err.message);
    }
  }

  // Option 3: Local file fallback
  try {
    return require(config.firebaseServiceAccountPath);
  } catch (err) {
    console.error(`[Firebase Admin] Failed to load credentials from ${config.firebaseServiceAccountPath}:`, err.message);
    throw new Error('Firebase Service Account credentials missing. Provide FIREBASE_SERVICE_ACCOUNT env var or firebase-service-account.json file.');
  }
}

function getFirebaseAdmin() {
  // Prevent re-initialization on hot reload or serverless invocations
  if (getApps().length > 0) return getApps()[0];

  try {
    const serviceAccount = getServiceAccountCredentials();
    const app = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
      storageBucket: 'quick--finder.firebasestorage.app',
    });
    console.log('[Firebase Admin] Initialized with Realtime DB. Project:', serviceAccount.project_id);
    return app;
  } catch (err) {
    console.error('[Firebase Admin] Failed to initialize:', err.message);
    throw err;
  }
}

function getFirebaseAuth() {
  getFirebaseAdmin();
  return getAuth();
}

function getFirebaseStorage() {
  getFirebaseAdmin();
  return getStorage();
}

function getFirebaseFirestore() {
  getFirebaseAdmin();
  return getFirestore();
}

function getFirebaseDb() {
  getFirebaseAdmin();
  return getDatabase();
}

module.exports = {
  getFirebaseAdmin,
  getFirebaseAuth,
  getFirebaseStorage,
  getFirebaseFirestore,
  getFirebaseDb,
};
