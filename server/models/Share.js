const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true,
  },
  sharedBy: { // The owner of the file who initiated the share
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sharedWith: { // The user receiving access
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  encryptedFileSymmetricKeyForRecipient: { // FSK re-encrypted with recipient's userPublicKey, Base64 encoded
    type: String,
    required: [true, 'Encrypted FSK for recipient is required.'],
  },
  accessLevel: {
    type: String,
    enum: ['view', 'download' /*, 'edit' */], // 'edit' would be much more complex
    default: 'download', // 'download' implies 'view'
  },
  sharedAt: {
    type: Date,
    default: Date.now,
  },
  // Optional: expiresAt: Date, // For time-limited shares
}, { timestamps: true }); // `timestamps: true` will add `createdAt` and `updatedAt`

// Ensure a file is not shared multiple times with the same user by the same sharer
// (though typically a file is shared by its owner only)
shareSchema.index({ file: 1, sharedWith: 1 }, { unique: true });

const Share = mongoose.model('Share', shareSchema);
module.exports = Share;