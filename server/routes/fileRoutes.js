// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadFile,
  listFilesAndFolders,
  downloadFile,
  getFileMetadata,
  createFolder,
} = require('../controllers/fileController');

const router = express.Router();

// Multer storage configuration
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    if (!require('fs').existsSync(UPLOADS_DIR)) {
        require('fs').mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the encrypted blob (e.g., UUID + original extension if desired)
    // For encrypted blobs, the original extension might not be as relevant.
    // A simple UUID is fine for the stored encrypted blob.
    cb(null, uuidv4() + path.extname(file.originalname)); // e.g. abc-123.dat or just abc-123
  },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit, adjust as needed
}); // Middleware for single file upload

router.post('/upload', protect, upload.single('encryptedFileBlob'), uploadFile); // 'encryptedFileBlob' is the field name in FormData
router.get('/', protect, listFilesAndFolders);
router.get('/:fileId/metadata', protect, getFileMetadata);
router.get('/:fileId/download', protect, downloadFile);
router.post('/folders', protect, createFolder); // Use /folders for folder creation

module.exports = router;