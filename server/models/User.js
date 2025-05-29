// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required.'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address.'],
  },
  password: { // This will store the hashed password
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.'], // Enforce minimum length for security
  },
  userPublicKey: { // PEM format of the user's RSA public key
    type: String,
    // required: true // Make this required if users must generate keys on registration
    // If not required on registration, client needs to prompt user to generate/upload it later
  },
  // Note: The clientSalt for deriving the master key from the password (as discussed previously)
  // is not explicitly in this model spec but would be essential for client-side master key derivation.
  // If userPublicKey is used to encrypt a master symmetric key instead of directly FSKs,
  // then a clientSalt might not be needed on the server.
  // For this model, we assume userPublicKey is used for FSK encryption as per your file model.

}, { timestamps: true }); // timestamps: true adds createdAt and updatedAt automatically

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;