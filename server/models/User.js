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
  clientSalt: {
    type: String,
    required: true,
  },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
}

// userSchema.pre('save', async function (next) {
//   try {
//     if (!this.clientSalt) {
//       this.clientSalt = crypto.randomBytes(16).toString('base64');
//     }


//     if (this.isModified('passwordHash')) {
//       const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
//       const salt = await bcrypt.genSalt(saltRounds);
//       this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
//     }

//     next();
//   } catch (err) {
//     console.error('❌ Error in pre-save:', err);
//     next(err);
//   }
// });

const User = mongoose.model('User', userSchema);
module.exports = User;
