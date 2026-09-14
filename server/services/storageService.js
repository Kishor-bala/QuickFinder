const { getFirebaseStorage } = require('../config/firebaseAdmin');

class StorageService {
  /**
   * Upload an image file buffer to Firebase Storage.
   * If bucket is unavailable, returns a structured Base64 Data URI object.
   */
  async uploadImage(file, folder = 'items') {
    if (!file || !file.buffer) return null;

    const mimeType = file.mimetype || 'image/jpeg';
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1e6);
    const filename = `${folder}/${timestamp}_${randomSuffix}.${mimeType.split('/')[1] || 'jpg'}`;

    try {
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      const [exists] = await bucket.exists();

      if (exists) {
        const fileRef = bucket.file(`lost-found/${filename}`);
        await fileRef.save(file.buffer, {
          metadata: { contentType: mimeType }
        });
        
        // Generate signed/public download URL reference
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`lost-found/${filename}`)}?alt=media`;
        return {
          storagePath: `lost-found/${filename}`,
          downloadUrl,
          mimeType,
          size: file.size || file.buffer.length,
          createdAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn(`[StorageService] Firebase Storage upload notice (${err.message}). Using structured Data URI fallback.`);
    }

    // Fallback: Return structured Data URI payload
    const base64Str = file.buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Str}`;
    return {
      storagePath: `inline/${filename}`,
      downloadUrl: dataUri,
      dataUri,
      mimeType,
      size: file.size || file.buffer.length,
      createdAt: new Date().toISOString()
    };
  }

  async uploadMultipleImages(files, folder = 'items') {
    if (!Array.isArray(files) || files.length === 0) return [];
    const results = [];
    for (const file of files) {
      const result = await this.uploadImage(file, folder);
      if (result) results.push(result);
    }
    return results;
  }
}

module.exports = new StorageService();
