const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

// Standard upload (legacy, 12 files)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, fieldSize: 25 * 1024 * 1024, files: 30 }
});

// Extended upload for hostel wizard — accepts any named fields, up to 80 files total
const uploadHostel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, fieldSize: 50 * 1024 * 1024, files: 100 }
});

module.exports = { upload, uploadHostel, UPLOADS_DIR };
