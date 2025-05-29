// // controllers/fileController.js
// const File = require('../models/File');
// const Folder = require('../models/Folder');
// const ShareToken = require('../models/ShareToken');
// const path = require('path');
// const fs = require('fs');
// const { v4: uuidv4 } = require('uuid');
// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
// const { generateRSAKeyPair } = require('../utils/keyUtils');

// const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // Ensure this directory exists

// // @desc    Upload a new encrypted file
// // @route   POST /api/files/upload
// // @access  Private
// exports.uploadFile = async (req, res) => {
//   try {
//     const { originalFilename, encryptedFileKey, iv, keyEncryptionIv, folderId } = req.body; // Metadata from client
//     const file = req.file; // Uploaded encrypted blob from multer

//     if (!file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
//     if (!originalFilename || !encryptedFileKey || !iv || !keyEncryptionIv) {
//       return res.status(400).json({ message: 'Missing required file metadata' });
//     }

//     // Check if parent folder exists and belongs to the user (if folderId is provided)
//     if (folderId) {
//         const parentFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
//         if (!parentFolder) {
//             // Clean up uploaded file if folder is invalid
//             fs.unlinkSync(file.path);
//             return res.status(404).json({ message: 'Parent folder not found or access denied' });
//         }
//     }
//     //load file buffer
//     const fileBuffer = fs.readFileSync(file.path);

//     //gen RSA key pair
//     const {privateKey, publicKeyOwnerPart, publicKeyTTPPart} = generateRSAKeyPair();
    
//     //encrypt file with private key
//     const encryptedData = Buffer.from(privateKey.encrypt(fileBuffer.toString('binary'), 'RSAES-PKCS1-V1_5'), 'binary');

//     //replace file with encrypted one
//     fs.writeFileSync(filePath, encryptedData);


//     const newFile = new File({
//       originalFilename,
//       encryptedFilename: file.filename, // Multer provides this unique filename
//       mimeType: file.mimetype,
//       size: file.size, // This is the size of the encrypted blob, client should send original size too if needed for display
//       encryptedFileKey,
//       iv,
//       keyEncryptionIv,
//       uploader: req.user.id,
//       folder: folderId || null,
//       KTTP: publicKeyTTPPart
//     });

//     await newFile.save();
//     res.status(201).json({
//         message: 'File uploaded successfully',
//         file: {
//             _id: newFile._id,
//             originalFilename: newFile.originalFilename,
//             mimeType: newFile.mimeType,
//             size: newFile.size, // Consider sending original size from client
//             createdAt: newFile.createdAt,
//             folder: newFile.folder,
//             ko: publicKeyOwnerPart // storage in local
//         }
//     });
//   } catch (error) {
//     console.error('Upload Error:', error);
//     // If a file was uploaded and an error occurred, try to delete it
//     if (req.file && req.file.path) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (unlinkErr) {
//         console.error('Error deleting orphaned upload file:', unlinkErr);
//       }
//     }
//     res.status(500).json({ message: 'Server error during file upload', error: error.message });
//   }
// };

// // @desc    List files and folders for the current user
// // @route   GET /api/files
// // @access  Private (query params: ?folderId=xxx for specific folder, null for root)
// exports.listFilesAndFolders = async (req, res) => {
//   try {
//     const { folderId } = req.query; // parent folder ID or null/undefined for root
//     const parentFolderQuery = folderId === 'null' || !folderId ? null : folderId;

//     // Validate folderId if provided
//     if (parentFolderQuery) {
//         const parent = await Folder.findOne({ _id: parentFolderQuery, owner: req.user.id });
//         if (!parent) {
//             return res.status(404).json({ message: "Parent folder not found or access denied" });
//         }
//     }

//     const files = await File.find({ uploader: req.user.id, folder: parentFolderQuery })
//                             .select('originalFilename mimeType size createdAt _id folder')
//                             .sort({ createdAt: -1 });

//     const folders = await Folder.find({ owner: req.user.id, parentFolder: parentFolderQuery })
//                               .select('name createdAt _id parentFolder')
//                               .sort({ name: 1 });

//     res.json({ files, folders });
//   } catch (error) {
//     console.error('List Error:', error);
//     res.status(500).json({ message: 'Server error listing files/folders', error: error.message });
//   }
// };


// // @desc    Get metadata for a specific file (for decryption)
// // @route   GET /api/files/:fileId/metadata
// // @access  Private
// exports.getFileMetadata = async (req, res) => {
//     try {
//         const file = await File.findOne({ _id: req.params.fileId, uploader: req.user.id })
//                                .select('originalFilename mimeType encryptedFileKey iv keyEncryptionIv size'); // Add any other needed fields

//         if (!file) {
//             return res.status(404).json({ message: 'File not found or access denied' });
//         }
//         res.json(file);
//     } catch (error) {
//         console.error('Get File Metadata Error:', error);
//         if (error.kind === 'ObjectId') {
//             return res.status(404).json({ message: 'File not found (invalid ID format)' });
//         }
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };

// // @desc    Download an encrypted file
// // @route   GET /api/files/:fileId/download
// // @access  Private
// exports.downloadFile = async (req, res) => {
//   try {
//     const file = await File.findOne({ _id: req.params.fileId, uploader: req.user.id });

//     if (!file) {
//       return res.status(404).json({ message: 'File not found or access denied' });
//     }

//     const filePath = path.join(UPLOADS_DIR, file.encryptedFilename);

//     if (fs.existsSync(filePath)) {
//       res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`); // Suggest original name to client
//       res.setHeader('Content-Type', file.mimeType); // Set original mime type
//       res.download(filePath, file.originalFilename); // Serves the file
//     } else {
//       res.status(404).json({ message: 'File data not found on server' });
//     }
//   } catch (error) {
//     console.error('Download Error:', error);
//     if (error.kind === 'ObjectId') {
//         return res.status(404).json({ message: 'File not found (invalid ID format)' });
//     }
//     res.status(500).json({ message: 'Server error during file download', error: error.message });
//   }
// };

// // @desc    Create a new folder
// // @route   POST /api/folders
// // @access  Private
// exports.createFolder = async (req, res) => {
//   try {
//     const { name, parentFolderId } = req.body;
//     if (!name) {
//       return res.status(400).json({ message: 'Folder name is required' });
//     }

//     const parentQuery = parentFolderId === 'null' || !parentFolderId ? null : parentFolderId;

//     // Check if parent folder exists and belongs to user (if specified)
//     if (parentQuery) {
//         const parent = await Folder.findOne({ _id: parentQuery, owner: req.user.id });
//         if (!parent) {
//             return res.status(404).json({ message: "Parent folder not found or access denied" });
//         }
//     }

//     // Check for duplicate folder name in the same location for this user
//     const existingFolder = await Folder.findOne({
//         name,
//         owner: req.user.id,
//         parentFolder: parentQuery
//     });

//     if (existingFolder) {
//         return res.status(400).json({ message: `Folder "${name}" already exists in this location.` });
//     }

//     const newFolder = new Folder({
//       name,
//       owner: req.user.id,
//       parentFolder: parentQuery,
//     });

//     await newFolder.save();
//     res.status(201).json({
//         message: 'Folder created successfully',
//         folder: {
//             _id: newFolder._id,
//             name: newFolder.name,
//             parentFolder: newFolder.parentFolder,
//             createdAt: newFolder.createdAt
//         }
//     });
//   } catch (error) {
//     console.error('Create Folder Error:', error);
//     if (error.code === 11000) { // Duplicate key error
//         return res.status(400).json({ message: `A folder with that name already exists in this location.` });
//     }
//     res.status(500).json({ message: 'Server error creating folder', error: error.message });
//   }
// };

