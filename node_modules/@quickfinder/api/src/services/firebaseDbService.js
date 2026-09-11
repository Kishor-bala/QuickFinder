const { getFirebaseDb } = require('../config/firebaseAdmin');

/**
 * Simple in-memory cache to prevent hammering Firebase on every auth lookup.
 * getAllRecords scans the entire collection — without caching, every login
 * triggers a full Firebase read. Cache TTL: 10 seconds.
 */
const cache = new Map();
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function invalidateCache(path) {
  cache.delete(path);
}

/**
 * Atomic Auto-Increment Counter for Firebase Realtime Database
 */
async function getNextId(counterName) {
  const db = getFirebaseDb();
  const counterRef = db.ref(`counters/${counterName}`);
  const result = await counterRef.transaction((current) => {
    return (current || 0) + 1;
  });
  return result.snapshot.val();
}

/**
 * Get all records under a node as array (cached for 10s)
 */
async function getAllRecords(path) {
  const cached = getCached(path);
  if (cached) return cached;

  const db = getFirebaseDb();
  const snapshot = await db.ref(path).once('value');
  const val = snapshot.val();
  const result = val ? Object.values(val) : [];
  setCache(path, result);
  return result;
}

/**
 * Get a single record by ID
 */
async function getRecordById(path, id) {
  if (!id) return null;
  const db = getFirebaseDb();
  const snapshot = await db.ref(`${path}/${id}`).once('value');
  return snapshot.val() || null;
}

/**
 * Save / Update a record under a path (invalidates cache)
 */
async function setRecord(path, id, data) {
  invalidateCache(path);
  const db = getFirebaseDb();
  await db.ref(`${path}/${id}`).set(data);
  return data;
}

/**
 * Update specific fields of a record (invalidates cache)
 */
async function updateRecord(path, id, updates) {
  invalidateCache(path);
  const db = getFirebaseDb();
  await db.ref(`${path}/${id}`).update(updates);
  return getRecordById(path, id);
}

/**
 * Delete a record (invalidates cache)
 */
async function deleteRecord(path, id) {
  invalidateCache(path);
  const db = getFirebaseDb();
  await db.ref(`${path}/${id}`).remove();
  return true;
}

module.exports = {
  getNextId,
  getAllRecords,
  getRecordById,
  setRecord,
  updateRecord,
  deleteRecord,
};
