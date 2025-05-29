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
    const { originalFilename, folderId, accessControlList } = req.body; // Client gửi ACL
    const file = req.file; // File gốc từ multer

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!originalFilename || !accessControlList) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: 'Missing required file metadata' });
    }

    if (folderId) {
      const parentFolder = await Folder.findOne({ _id: folderId, owner: req.user.id });
      if (!parentFolder) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ message: 'Parent folder not found or access denied' });
      }
    }

    // Tạo cặp khóa RSA
    const key = new RSA({ b: 2048 });
    const privateKey = key.exportKey('private');
    const publicKey = key.exportKey('public');

    // Mã hóa file
    const fileContent = fs.readFileSync(file.path);
    const encryptedFile = new RSA(privateKey).encryptPrivate(fileContent, 'buffer');

    // Phân chia khóa công khai
    const publicKeyBytes = Buffer.from(publicKey);
    const parts = Secrets.split(publicKeyBytes, { shares: 2, threshold: 2 });
    const key_o = parts[1];
    const key_ttp = parts[2];

    // Tải file lên S3
    const fileId = require('crypto').randomBytes(16).toString('hex');
    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: fileId,
      Body: encryptedFile,
    };
    await s3.upload(s3Params).promise();

    // Lưu metadata
    const newFile = new File({
      fileId,
      originalFilename,
      mimeType: file.mimetype,
      size: file.size,
      encryptedFileKey: key_ttp.toString('base64'),
      accessControlList: JSON.parse(accessControlList),
      uploader: req.user.id,
      folder: folderId || null,
    });
    await newFile.save();

    // Xóa file cục bộ và khóa riêng
    fs.unlinkSync(file.path);
    delete privateKey;

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
        key_o: key_o.toString('base64'),
      },
    });
  } catch (error) {
    console.error('Upload Error:', error);
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

exports.accessFile = async (req, res) => {
  try {
    const { fileId, key_o } = req.body;
    const file = await File.findOne({ fileId });
    if (!file || !file.accessControlList.some(u => u.userId.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const key_ttp = Buffer.from(file.encryptedFileKey, 'base64');
    const publicKeyBytes = Secrets.join([Buffer.from(key_o, 'base64'), key_ttp]);
    const publicKey = new RSA().importKey(publicKeyBytes);

    const s3Params = { Bucket: process.env.S3_BUCKET, Key: fileId };
    const encryptedFile = await s3.getObject(s3Params).promise();

    const decryptedFile = new RSA(publicKey).decryptPublic(encryptedFile.Body, 'buffer');

    res.set('Content-Type', file.mimeType);
    res.send(decryptedFile);
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