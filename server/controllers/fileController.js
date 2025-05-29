// controllers/fileController.js
const File = require('../models/File');
const Folder = require('../models/Folder');
const ShareToken = require('../models/ShareToken');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateRSAKeyPair } = require('../utils/keyUtils');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // Ensure this directory exists

// @desc    Upload a new encrypted file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    const { originalFilename, encryptedFileKey, iv, keyEncryptionIv, folderId } = req.body; // Metadata from client
    const file = req.file; // Uploaded encrypted blob from multer

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!originalFilename || !encryptedFileKey || !iv || !keyEncryptionIv) {
      return res.status(400).json({ message: 'Missing required file metadata' });
    }

    // Check if parent folder exists and belongs to the user (if folderId is provided)
    if (folderId) {
        const parentFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
        if (!parentFolder) {
            // Clean up uploaded file if folder is invalid
            fs.unlinkSync(file.path);
            return res.status(404).json({ message: 'Parent folder not found or access denied' });
        }
    }
    //load file buffer
    const fileBuffer = fs.readFileSync(file.path);

    //gen RSA key pair
    const {privateKey, publicKeyOwnerPart, publicKeyTTPPart} = generateRSAKeyPair();
    
    //encrypt file with private key
    const encryptedData = Buffer.from(privateKey.encrypt(fileBuffer.toString('binary'), 'RSAES-PKCS1-V1_5'), 'binary');
    
    //replace file with encrypted one
    fs.writeFileSync(filePath, encryptedData);


    const newFile = new File({
      originalFilename,
      encryptedFilename: file.filename, // Multer provides this unique filename
      mimeType: file.mimetype,
      size: file.size, // This is the size of the encrypted blob, client should send original size too if needed for display
      encryptedFileKey,
      iv,
      keyEncryptionIv,
      uploader: req.user.id,
      folder: folderId || null,
      KTTP: publicKeyTTPPart
    });

    await newFile.save();
    res.status(201).json({
        message: 'File uploaded successfully',
        file: {
            _id: newFile._id,
            originalFilename: newFile.originalFilename,
            mimeType: newFile.mimeType,
            size: newFile.size, // Consider sending original size from client
            createdAt: newFile.createdAt,
            folder: newFile.folder,
            ko: publicKeyOwnerPart // storage in local
        }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    // If a file was uploaded and an error occurred, try to delete it
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting orphaned upload file:', unlinkErr);
      }
    }
    res.status(500).json({ message: 'Server error during file upload', error: error.message });
  }
};

// @desc    List files and folders for the current user
// @route   GET /api/files
// @access  Private (query params: ?folderId=xxx for specific folder, null for root)
exports.listFilesAndFolders = async (req, res) => {
  try {
    const { folderId } = req.query; // parent folder ID or null/undefined for root
    const parentFolderQuery = folderId === 'null' || !folderId ? null : folderId;

    // Validate folderId if provided
    if (parentFolderQuery) {
        const parent = await Folder.findOne({ _id: parentFolderQuery, owner: req.user.id });
        if (!parent) {
            return res.status(404).json({ message: "Parent folder not found or access denied" });
        }
    }

    const files = await File.find({ uploader: req.user.id, folder: parentFolderQuery })
                            .select('originalFilename mimeType size createdAt _id folder')
                            .sort({ createdAt: -1 });

    const folders = await Folder.find({ owner: req.user.id, parentFolder: parentFolderQuery })
                              .select('name createdAt _id parentFolder')
                              .sort({ name: 1 });

    res.json({ files, folders });
  } catch (error) {
    console.error('List Error:', error);
    res.status(500).json({ message: 'Server error listing files/folders', error: error.message });
  }
};


// @desc    Get metadata for a specific file (for decryption)
// @route   GET /api/files/:fileId/metadata
// @access  Private
exports.getFileMetadata = async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.fileId, uploader: req.user.id })
                               .select('originalFilename mimeType encryptedFileKey iv keyEncryptionIv size'); // Add any other needed fields

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }
        res.json(file);
    } catch (error) {
        console.error('Get File Metadata Error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'File not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// hainhat code, do not remove
exports.shareFile = async(req, res) => {
  try {
    const { fileId } = req.params;
    const { recipientUserId, encryptedFileSymmetricKeyForRecipient } = req.body;
    const currentUserId = req.user.id;

    // check user permission to share the required file
    const file = await File.findById(fileId);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      if (file.owner.toString() !== currentUserId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this file' });
      }

    // check validity of recepient
    const recipientUser = await User.findById(recipientUserId);
      if (!recipientUser) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }

    // check is this file is already shared to this user
    const existingShare = await Share.findOne({
        file: fileId,
        sharedWith: recipientUserId,
      });
      if (existingShare) {
        return res.status(409).json({ message: 'File already shared with this user' });
      }

    // save the share data to share model

    const newShare = new Share({
      file: fileId,
      sharedBy: currentUserId,
      sharedWith: recipientUserId,
      encryptedFileSymmetricKeyForRecipient: encryptedFileSymmetricKeyForRecipient,
      // access level is 'view' by default
    })

    await newShare.save();

    // update isShared in filemodel
    if (!file.isShared) {
      file.isShared = true;
      await file.save();
    }

    res.status(200).json({ message: 'File shared successfully' });

  } catch (error) {
    console.error('Error when sharing file:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// controller cho viec xem file