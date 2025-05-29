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
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads'); // Ensure this directory exists

// @desc    Upload a new encrypted file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
  try {
    const {
      encryptedData,
      iv,
      authTag,
      fskEncrypted,
      hash,
      originalFilename,
      mimeType,
      size,
      folderId,
      accessControlList,
    } = req.body;

    if (!encryptedData || !iv || !authTag || !fskEncrypted || !hash || !originalFilename) {
      return res.status(400).json({ message: 'Missing required file data' });
    }

    // Kiểm tra folder cha
    if (folderId) {
      const parentFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found or access denied' });
      }
    }

    // Tải encrypted data lên S3
    const fileId = require('crypto').randomBytes(16).toString('hex');
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileId,
      Body: Buffer.from(encryptedData, 'base64'), // Giải mã base64 để lưu binary
      Metadata: { iv, authTag }, // Lưu IV và AuthTag trong metadata S3
    };
    await s3.upload(s3Params).promise();

    // Lưu metadata vào database
    const newFile = new File({
      fileId,
      originalFilename,
      mimeType,
      size: parseInt(size),
      encryptedFileKey: fskEncrypted, // FSK_encrypted
      hash, // F_hash
      accessControlList: JSON.parse(accessControlList),
      uploader: req.user.id,
      folder: folderId || null,
    });
    await newFile.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        _id: newFile._id,
        fileId: newFile.fileId,
        originalFilename: newFile.originalFilename,
        mimeType: newFile.mimeType,
        size: newFile.size,
        createdAt: newFile.createdAt,
        folder: newFile.folder,
      },
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during file upload', error: error.message });
  }
};


exports.accessFile = async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findOne({ fileId });
    if (!file || !file.accessControlList.some(u => u.userId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const s3Params = { Bucket: process.env.S3_BUCKET, Key: fileId };
    const encryptedFile = await s3.getObject(s3Params).promise();
    const { iv, authTag } = encryptedFile.Metadata;

    res.status(200).json({
      encryptedData: encryptedFile.Body.toString('base64'),
      iv,
      authTag,
      fskEncrypted: file.encryptedFileKey,
      hash: file.hash,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during file access', error: error.message });
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

// @desc    Download an encrypted file
// @route   GET /api/files/:fileId/download
// @access  Private
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, uploader: req.user.id });

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const filePath = path.join(UPLOADS_DIR, file.encryptedFilename);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`); // Suggest original name to client
      res.setHeader('Content-Type', file.mimeType); // Set original mime type
      res.download(filePath, file.originalFilename); // Serves the file
    } else {
      res.status(404).json({ message: 'File data not found on server' });
    }
  } catch (error) {
    console.error('Download Error:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'File not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error during file download', error: error.message });
  }
};

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const parentQuery = parentFolderId === 'null' || !parentFolderId ? null : parentFolderId;

    // Check if parent folder exists and belongs to user (if specified)
    if (parentQuery) {
        const parent = await Folder.findOne({ _id: parentQuery, owner: req.user.id });
        if (!parent) {
            return res.status(404).json({ message: "Parent folder not found or access denied" });
        }
    }

    // Check for duplicate folder name in the same location for this user
    const existingFolder = await Folder.findOne({
        name,
        owner: req.user.id,
        parentFolder: parentQuery
    });

    if (existingFolder) {
        return res.status(400).json({ message: `Folder "${name}" already exists in this location.` });
    }

    const newFolder = new Folder({
      name,
      owner: req.user.id,
      parentFolder: parentQuery,
    });

    await newFolder.save();
    res.status(201).json({
        message: 'Folder created successfully',
        folder: {
            _id: newFolder._id,
            name: newFolder.name,
            parentFolder: newFolder.parentFolder,
            createdAt: newFolder.createdAt
        }
    });
  } catch (error) {
    console.error('Create Folder Error:', error);
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ message: `A folder with that name already exists in this location.` });
    }
    res.status(500).json({ message: 'Server error creating folder', error: error.message });
  }
};

