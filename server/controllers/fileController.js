// controllers/fileController.js
const File = require('../models/File'); // Ensure this path is correct
// const Folder = require('../models/Folder'); // Commented out as we're not using it for now
const path = require('path');
const fs = require('fs').promises;

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
(async () => {
    try { await fs.mkdir(UPLOADS_DIR, { recursive: true }); }
    catch (err) { console.error("Error creating uploads directory:", err); }
})();

// @desc    Upload a new client-side encrypted file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
  const uploadedEncryptedFile = req.file;

  try {
    const {
      originalName,
      fileSize,
      mimeType,
      initializationVector,
      authenticationTag,
      fileHash,
      encryptedFileSymmetricKey,
      // folderId, // Commented out folderId from destructuring
    } = req.body;

    if (!uploadedEncryptedFile) {
      return res.status(400).json({ message: 'No encrypted file data (Fen) uploaded.' });
    }
    const requiredFields = { originalName, fileSize, mimeType, initializationVector, authenticationTag, fileHash, encryptedFileSymmetricKey };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        if (uploadedEncryptedFile && uploadedEncryptedFile.path) {
            try { await fs.unlink(uploadedEncryptedFile.path); } catch(e) { console.error("Cleanup error", e); }
        }
        return res.status(400).json({ message: `Missing required metadata: ${key}` });
      }
    }

    // --- Folder check commented out ---
    // if (folderId && folderId !== 'null') {
    //     const parentFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
    //     if (!parentFolder) {
    //         if (uploadedEncryptedFile && uploadedEncryptedFile.path) {
    //             try { await fs.unlink(uploadedEncryptedFile.path); } catch(e) { console.error("Cleanup error", e); }
    //         }
    //         return res.status(404).json({ message: 'Parent folder not found or access denied.' });
    //     }
    // }

    // Log to confirm File is what we expect
    // console.log("Using File constructor:", File);

    const newFile = new File({ // This should now work if 'File' is correctly imported
      owner: req.user.id,
      originalName,
      encryptedName: uploadedEncryptedFile.filename,
      fileSize: parseInt(fileSize, 10),
      mimeType,
      storagePath: uploadedEncryptedFile.path,
      initializationVector,
      authenticationTag,
      fileHash,
      encryptedFileSymmetricKey,
      folder: null, // Explicitly set to null as we are ignoring folders for now
      isShared: false,
    });

    await newFile.save();

    res.status(201).json({
      message: 'File uploaded successfully.',
      file: {
        _id: newFile._id,
        originalName: newFile.originalName,
        fileSize: newFile.fileSize,
        createdAt: newFile.createdAt,
      },
    });

  } catch (error) {
    console.error('File Upload Error:', error); // This will show the TypeError if File is still not a constructor
    if (uploadedEncryptedFile && uploadedEncryptedFile.path) {
      try {
        await fs.unlink(uploadedEncryptedFile.path);
        console.log("Cleaned up uploaded file due to error:", uploadedEncryptedFile.path);
      } catch (unlinkErr) {
        console.error('Error deleting orphaned uploaded file:', unlinkErr);
      }
    }
    if (error.code === 11000 && error.keyPattern && error.keyPattern.encryptedName) {
        return res.status(500).json({ message: "Internal error: generated encrypted name conflict. Please try again."});
    }
    // Updated index for files at root level (folder: null)
     if (error.code === 11000 && error.message.includes('owner_1_originalName_1')) {
        return res.status(400).json({ message: `A file named "${req.body.originalName}" already exists at the root level.` });
    }
    res.status(500).json({ message: 'Server error during file upload.', error: error.message });
  }
};

// controllers/fileController.js

// @desc    List files for the current user (root level only for now)
// @route   GET /api/files
// @access  Private
exports.listFiles = async (req, res) => {
  try {
    if (!req.user || !req.user.id) { // Added check for req.user
        console.error('ListFiles Error: req.user not defined. Auth middleware issue?');
        return res.status(401).json({ message: "Not authorized, user information missing." });
    }

    console.log(`Fetching files for user: ${req.user.id}`); // Debug log

    const files = await File.find({ owner: req.user.id, folder: null }) // Corrected 'uploader' to 'owner'
                            .select('originalName mimeType fileSize createdAt _id fileHash') // Added fileHash
                            .sort({ createdAt: -1 });

    console.log(`Found ${files.length} files for user ${req.user.id}`); // Debug log

    res.json({ files, folders: [] }); // Return empty array for folders for now
  } catch (error) {
    console.error('List Files Error:', error);
    res.status(500).json({ message: 'Server error listing files', error: error.message });
  }
};


exports.prepareForDownload = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Not authorized, user information missing." });
        }

        const file = await File.findOne({ _id: req.params.fileId, owner: req.user.id })
            .select('encryptedName originalName mimeType storagePath initializationVector authenticationTag encryptedFileSymmetricKey fileHash'); // Selected all necessary fields

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied.' });
        }
        res.json({
            fileId: file._id, // Good to send back for confirmation
            encryptedName: file.encryptedName, // Crucial for fetching the blob
            originalName: file.originalName,
            mimeType: file.mimeType,
            // storagePath: file.storagePath, // Client doesn't strictly need this if encryptedName is the key
            initializationVector: file.initializationVector,
            authenticationTag: file.authenticationTag,
            encryptedFileSymmetricKey: file.encryptedFileSymmetricKey, // FSK_encrypted
            fileHash: file.fileHash, // For client-side integrity check
        });
    } catch (error) {
        console.error("Prepare Download Error:", error);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: 'File not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error preparing file for download.', error: error.message });
    }
};

// @desc    Download an encrypted file blob (Fen)
// @route   GET /api/files/blobs/:encryptedName
// @access  Private
exports.downloadEncryptedBlob = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Not authorized, user information missing." });
        }

        // Query for the file using its encryptedName AND ensure the current user is the owner.
        // This prevents a user from trying to guess encryptedNames if they somehow bypass
        // the /prepare-download step or if that step didn't have strict enough checks.
        const fileRecord = await File.findOne({
            encryptedName: req.params.encryptedName,
            owner: req.user.id
        });

        if (!fileRecord) {
             // This means either the file doesn't exist by that encryptedName,
             // OR the currently authenticated user does not own it.
             return res.status(404).json({ message: 'Encrypted blob not found or access denied.' });
        }

        // The 'storagePath' field in your File model stores the full path given by Multer.
        // If UPLOADS_DIR is the root and encryptedName is just the filename:
        // const filePath = path.join(UPLOADS_DIR, fileRecord.encryptedName);
        // However, your upload function stores uploadedEncryptedFile.path in fileRecord.storagePath:
        // storagePath: uploadedEncryptedFile.path,
        // So, we should use fileRecord.storagePath directly.
        const filePath = fileRecord.storagePath;


        // Check if file exists before sending
        try {
            await fs.access(filePath); // Check if file exists and is accessible
            res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}.encrypted"`); // Suggest a name
            res.setHeader('Content-Type', 'application/octet-stream'); // It's an opaque encrypted blob
            res.sendFile(filePath); // Serves the file from its stored path
        } catch (fileAccessError) {
            console.error(`File blob access error for ${filePath}:`, fileAccessError);
            // This could happen if the file was deleted from disk but the DB record still exists.
            res.status(404).json({ message: 'Encrypted file data not found on server disk.' });
        }
    } catch (error) {
        console.error("Download Blob Error:", error);
        res.status(500).json({ message: 'Server error during blob download.', error: error.message });
    }
};