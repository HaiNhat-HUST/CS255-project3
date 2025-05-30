// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Good for querying files by owner
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required.'],
    trim: true,
  },
  encryptedName: { // Filename on disk (e.g., UUID)
    type: String,
    required: [true, 'Encrypted file name for storage is required.'],
    unique: true, // Ensures no two stored files have the same physical name
  },
  fileSize: { // Original file size in bytes
    type: Number,
    required: [true, 'File size is required.'],
  },
  mimeType: {
    type: String,
    trim: true,
    default: 'application/octet-stream', // A sensible default
  },
  storagePath: { // Could be relative path in 'uploads/' or full S3 key etc.
    type: String,
    required: [true, 'Storage path is required.'],
    // This might be redundant if encryptedName is used as the key in a flat storage structure
    // If using folders in storage, this would be like 'user_id/encryptedName'
  },
  initializationVector: { // Base64 encoded IV for AES-GCM
    type: String,
    required: [true, 'Initialization Vector (IV) is required.'],
  },
  authenticationTag: { // Base64 encoded GCM Authentication Tag
    type: String,
    required: [true, 'Authentication Tag is required.'],
  },
  fileHash: { // SHA-256 hash of the original (unencrypted) file content
    type: String,
    required: [true, 'File hash is required for integrity checks.'],
    // Example length for SHA-256 hex string: 64
  },
  encryptedFileSymmetricKey: { // File Symmetric Key (FSK) encrypted with owner's userPublicKey, Base64 encoded
    type: String,
    required: [true, 'Encrypted File Symmetric Key is required.'],
  },
  isShared: { // Convenience flag, can be derived from Share collection too
    type: Boolean,
    default: false,
    index: true,
  },
  folder: { // Optional: reference to a Folder model if you implement folders
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder', // Assuming you'll have a Folder model later
    default: null,
  },
}, { timestamps: true });

// Compound index for owner and originalName in a specific folder (if folders are used)
// to prevent user from uploading files with same name in same location.
fileSchema.index({ owner: 1, folder: 1, originalName: 1 }, { unique: true, partialFilterExpression: { folder: { $type: "objectId" } } });
fileSchema.index({ owner: 1, originalName: 1 }, { unique: true, partialFilterExpression: { folder: null } }); 


const File = mongoose.model('File', fileSchema);
module.exports = File;