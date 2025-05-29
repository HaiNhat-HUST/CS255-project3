const User = require('../models/User');

exports.getUserPublicKey = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('userPublicKey username'); // Chỉ lấy userPublicKey và username
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ userPublicKey: user.userPublicKey, username: user.username });
    } catch (error) {
        console.error('Error fetching user public key:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserPublicKeyByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('userPublicKey _id'); // Lấy public key và _id
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ userId: user._id, userPublicKey: user.userPublicKey });
    } catch (error) {
        console.error('Error fetching user public key by username:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Thêm nếu cần
exports.generateAndSavePublicKey = async (req, res) => {
  try {
    const { userPublicKey } = req.body;
    if (!userPublicKey) return res.status(400).json({ message: 'Public key is required' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.userPublicKey = userPublicKey;
    await user.save();
    res.status(200).json({ message: 'Public key updated', userPublicKey });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};