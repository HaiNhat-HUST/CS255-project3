// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalFilename: { // Filename as displayed to the user (unencrypted)
    type: String,
    required: true,
    trim: true,
  },
  encryptedFilename: { // The actual name of the stored encrypted file on the server (e.g., a UUID)
    type: String,
    required: true,
    unique: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: { // Original file size
    type: Number,
    required: true,
  },
  encryptedFileKey: { // File's symmetric key, encrypted with user's master key (base64)
    type: String,
    required: true,
  },
  iv: { // IV for AES-GCM encryption of file content (base64)
    type: String,
    required: true,
  },
  keyEncryptionIv: { // IV used for encrypting the encryptedFileKey (base64)
    type: String,
    required: true,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  folder: { // Optional: ID of the parent folder
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
module.exports = File;