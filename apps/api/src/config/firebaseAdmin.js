/**
 * Firebase Admin SDK Initialization (Backend)
 * Project: quick--finder
 * firebase-admin v12+ uses named exports
 */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');
const { getDatabase } = require('firebase-admin/database');
const config = require('../config');

const FIREBASE_DB_URL = 'https://quick--finder-default-rtdb.asia-southeast1.firebasedatabase.app';

function getFirebaseAdmin() {
  // Prevent re-initialization on hot reload
  if (getApps().length > 0) return getApps()[0];

  try {
    const serviceAccount = require(config.firebaseServiceAccountPath);
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

