// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  // Salt for deriving client-side master key. Store it with the user.
  // This salt is different from the salt bcryptjs uses internally for passwordHash.
  clientSalt: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true }); // `timestamps: true` automatically adds createdAt and updatedAt

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Middleware to hash password before saving (if modified)
// and generate clientSalt if it's a new user
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') && this.isNew) { // Only hash if password is new/modified
     // This condition seems problematic for initial save. Let's adjust.
  }

  if (this.isNew || this.isModified('passwordHash')) { // Hash password if it's new or has been modified
    if (this.isNew) { // Generate clientSalt only for new users
        const saltRoundsForClient = 16; // bytes, then base64 encoded
        const crypto = require('crypto');
        this.clientSalt = crypto.randomBytes(saltRoundsForClient).toString('base64');
    }
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});


const User = mongoose.model('User', userSchema);
module.exports = User;