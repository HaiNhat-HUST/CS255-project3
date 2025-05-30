// controllers/authController.js (or a new userController.js)

const User = require('../models/User');

// ... (registerUser, loginUser, getUserProfile from previous setup) ...

// @desc    Update user's public key
// @route   PUT /api/auth/me/public-key  (or /api/users/me/public-key)
// @access  Private
exports.updateUserPublicKey = async (req, res) => {
    try {
        const { publicKey } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            return res.status(400).json({ message: 'Public key is required and must be a string.' });
        }

        // Basic validation for PEM format (can be improved)
        if (!publicKey.startsWith('-----BEGIN PUBLIC KEY-----') || !publicKey.endsWith('-----END PUBLIC KEY-----')) {
            // return res.status(400).json({ message: 'Invalid public key format. PEM format expected.' });
            // Allow flexibility for now, client must ensure correct format for its own crypto ops
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

// @desc    Get user's public key (e.g., for sharing)
// @route   GET /api/users/:userId/public-key
// @access  Private (or Public if keys are meant to be discoverable)
exports.getUserPublicKeyById = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('username userPublicKey');
        if (!user || !user.userPublicKey) {
            return res.status(404).json({ message: 'User or public key not found.' });
        }
        res.json({ userId: user._id, username: user.username, userPublicKey: user.userPublicKey });
    } catch (error) {
        console.error("Get User Public Key Error:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found (invalid ID format)' });
        }
        res.status(500).json({ message: 'Server error retrieving public key.', error: error.message });
    }
};