const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = config.uploadDir;
    if (file.fieldname === 'profile_photo') {
      dest = path.join(dest, 'profiles');
    } else if (file.fieldname === 'proof_image') {
      dest = path.join(dest, 'proofs');
    } else {
      dest = path.join(dest, 'items');
    }
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (e) {
      // Ignored if directory creation fails or exists in read-only environment
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMime.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed formats: JPEG, PNG, WEBP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
