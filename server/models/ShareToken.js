// models/ShareToken.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const shareTokenSchema = new mongoose.Schema({
  tokenValueHash: { // Hashed version of the share token
    type: String,
    required: true,
    unique: true,
  },
  entityId: { // ID of the File or Folder being shared
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // No ref here as it could be 'File' or 'Folder', use entityType to determine
  },
  entityType: { // 'file' or 'folder'
    type: String,
    required: true,
    enum: ['file', 'folder'],
  },
  owner: { // User who created the share
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  expiresAt: {
    type: Date,
    default: null, // null means no expiration
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active',
  },
}, { timestamps: true });

const ShareToken = mongoose.model('ShareToken', shareTokenSchema);
module.exports = ShareToken;