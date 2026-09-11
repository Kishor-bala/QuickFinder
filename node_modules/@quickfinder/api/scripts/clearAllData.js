/**
 * Clear All Data Script
 * Removes all dummy/mock data, uploaded files, and clears Firebase Database nodes
 */
const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const { getFirebaseDb } = require('../src/config/firebaseAdmin');

async function clearAllData() {
  console.log('🧹 Clearing all dummy data, uploads, and Firebase Database nodes...');

  // 1. Clear Firebase Realtime DB nodes
  try {
    const db = getFirebaseDb();
    const nodes = ['users', 'lost_items', 'found_items', 'claims', 'matches', 'notifications', 'counters', 'item_images'];
    for (const node of nodes) {
      await db.ref(node).remove();
      console.log(`✓ Cleared Firebase Database node: ${node}`);
    }
  } catch (err) {
    console.warn('[Firebase DB Clear] Notice:', err.message);
  }

  // 2. Clear uploaded files
  const uploadDirs = [
    path.join(config.uploadDir, 'items'),
    path.join(config.uploadDir, 'profiles'),
    path.join(config.uploadDir, 'proofs'),
  ];

  uploadDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log(`✓ Cleaned directory: ${dir}`);
    }
  });

  console.log('==================================================');
  console.log('✨ All Firebase Database nodes and uploads cleared!');
  console.log('==================================================');
}

clearAllData().catch((err) => {
  console.error('❌ Error clearing data:', err);
  process.exit(1);
});
