const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true }, // ID trên S3
  originalFilename: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  encryptedFileKey: { type: String, required: true }, // FSK_encrypted
  hash: { type: String, required: true }, // F_hash (SHA-256)
  accessControlList: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permission: { type: String, enum: ['read', 'write'], required: true },
  }],
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
}, { timestamps: true });


// // Compound index for owner and originalName in a specific folder (if folders are used)
// // to prevent user from uploading files with same name in same location.
// fileSchema.index({ owner: 1, folder: 1, originalName: 1 }, { unique: true, partialFilterExpression: { folder: { $type: "objectId" } } });
// fileSchema.index({ owner: 1, originalName: 1 }, { unique: true, partialFilterExpression: { folder: null } });


// const File = mongoose.model('File', fileSchema);
// module.exports = File;