// controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken'); // Ensure this utility exists

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password, userPublicKey } = req.body; // 'password' here is the plain text password from user input

  try {
    // --- Input Validation ---
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }
    // Your User model schema has minlength for passwordHash, but it's good practice to validate plain password length too
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    if (!userPublicKey) { // userPublicKey is now required by your model
        return res.status(400).json({ message: 'User public key is required for registration.' });
    }
    // You might add PEM format validation for userPublicKey here if desired, though client-side should ensure format

    // --- Check if user exists ---
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (userExists) {
      let message = 'User already exists.';
      if (userExists.email === email.toLowerCase()) message = 'User with this email already exists.';
      if (userExists.username === username) message = 'User with this username already exists.';
      return res.status(400).json({ message });
    }

    // --- Create new user ---
    // The plain 'password' from req.body will be assigned to user.passwordHash.
    // The pre-save hook in User.js will then hash it correctly before saving to the database.
    const user = new User({
      username,
      email: email.toLowerCase(),
      passwordHash: password, // Assign plain password here; pre-save hook will hash it
      userPublicKey,
    });

    await user.save(); // Triggers pre-save hook, which hashes `user.passwordHash`

    // --- Generate token and respond ---
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      userPublicKey: user.userPublicKey,
      token,
    });

  } catch (error) {
    console.error("Registration Error:", error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join('. ') });
    }
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body; // 'password' is the plain text password from user input

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password.' });
    }

    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email }
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Use the matchPassword method from the User model
    // This will compare the entered plain 'password' with the stored 'user.passwordHash'
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      userPublicKey: user.userPublicKey,
      token,
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

// @desc    Get current user's profile
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile = async (req, res) => {
  if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, user context missing.' });
  }
  try {
    // Fetch user data, excluding the passwordHash
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        userPublicKey: user.userPublicKey,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
      console.error("Get User Profile Error:", error);
      res.status(500).json({ message: "Server error fetching profile.", error: error.message });
  }
};

// @desc    Update user's public key (This function assumes user might want to update it later)
// @route   PUT /api/auth/me/public-key
// @access  Private
exports.updateUserPublicKey = async (req, res) => {
    // Since your model now requires userPublicKey on creation, this endpoint might be
    // less about setting it for the first time and more about updating it if allowed.
    // Changing a public key has significant implications for data encrypted with the old one.
    // For now, we'll assume it's for updates.
    try {
        const { publicKey } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            return res.status(400).json({ message: 'New public key is required and must be a string.' });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.userPublicKey = publicKey;
        await user.save();

        res.json({
            message: 'Public key updated successfully.',
            userPublicKey: user.userPublicKey,
        });

    } catch (error) {
        console.error("Update Public Key Error:", error);
        res.status(500).json({ message: 'Server error updating public key.', error: error.message });
    }
};

// @desc    Get a specific user's public key (e.g., for sharing files with them)
// @route   GET /api/users/:userId/public-key
// @access  Authenticated users (Private)
exports.getUserPublicKeyById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('username userPublicKey email');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // userPublicKey is required by your model, so it should always exist if the user record exists.
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email, // Consider if email should be exposed here
            userPublicKey: user.userPublicKey
        });
    } catch (error) {
        console.error("Get User Public Key Error:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found (invalid ID format).' });
        }
        res.status(500).json({ message: 'Server error retrieving public key.', error: error.message });
    }
};