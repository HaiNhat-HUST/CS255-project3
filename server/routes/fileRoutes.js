// routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadFile,
  prepareForDownload,
  downloadEncryptedBlob,
  listFiles, // Renamed from listFilesAndFolders
  // createFolder, // Commented out
} = require('../controllers/fileController');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
        await require('fs').promises.mkdir(UPLOADS_DIR, { recursive: true });
        cb(null, UPLOADS_DIR);
    } catch (err) { cb(err); }
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + (path.extname(file.originalname) || '.enc'));
  },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
});

router.post('/upload', protect, upload.single('encryptedFileBlob'), uploadFile);
router.get('/:fileId/prepare-download', protect, prepareForDownload);
router.get('/blobs/:encryptedName', protect, downloadEncryptedBlob);
router.get('/', protect, listFiles); // Route for listing files (root level)

// router.post('/folders', protect, createFolder); // Commented out folder creation route

module.exports = router;