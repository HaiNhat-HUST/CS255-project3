const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AccessControlList = new mongoose.Schema({
  tokenValueHash: { 
    type: String,
    required: true,
    unique: true,
  },
  
  owner: {
    type: String
  }
  
})


const AccessControlListUser = mongoose.model('AccessControlList', userSchema);
module.exports = AccessControlList;