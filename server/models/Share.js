const mongoose = require('mongoose');


const shareSchema = new mongoose.Schema({
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    required: true,
  },

  sharedBy : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  accessLevel: {
    type: String,
    enum: ['view', 'download','edit'], // tạm thời chỉ có thể view
    default: 'view',
  },

  shareAt: {
    type: Date,
    default: Data.now,
  },
}, {timestamps: true })


const Share = mongoose.model('ShareToken', shareSchema);
module.exports = Share;