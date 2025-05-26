// models/Folder.js
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  parentFolder: { // Optional: ID of the parent folder for nesting
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  // To prevent path traversal issues if displaying full paths, or for easier querying.
  // Path could be an array of ancestor folder IDs, or a string like "/folder1/subfolderA"
  // For simplicity now, we'll rely on parentFolder.
}, { timestamps: true });

// Ensure a user cannot have two folders with the same name in the same parent folder.
folderSchema.index({ owner: 1, parentFolder: 1, name: 1 }, { unique: true });


const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;