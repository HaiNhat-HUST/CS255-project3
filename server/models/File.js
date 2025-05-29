const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileId: { // ID duy nhất của file trên Cloud Storage (ví dụ: AWS S3 key)
    type: String,
    required: true,
    unique: true,
  },
  originalFilename: { // Filename as displayed to the user (unencrypted)
    type: String,
    required: true,
    trim: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: { // Original file size
    type: Number,
    required: true,
  },
  encryptedFileKey: { // Phần khóa công khai lưu tại TTP (K_ttp), base64
    type: String,
    required: true,
  },
  accessControlList: { // Danh sách quyền truy cập (U_APL)
    type: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      permission: { type: String, enum: ['read', 'write'], required: true },
    }],
    default: [],
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