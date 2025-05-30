const express = require('express');
const router = express.Router();
const { getUserPublicKey, getUserPublicKeyByUsername } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Sửa đường dẫn nếu cần

console.log('protect:', typeof protect);
console.log('getUserPublicKey:', typeof getUserPublicKey);
console.log('getUserPublicKeyByUsername:', typeof getUserPublicKeyByUsername);

router.get('/public-key', protect, async (req, res) => {
  try {
    const User = require('../models/User'); // Thêm import nếu cần
    const user = await User.findById(req.user.id).select('userPublicKey username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ userPublicKey: user.userPublicKey, username: user.username });
  } catch (error) {
    console.error('Error fetching user public key:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/public-key/:username', protect, getUserPublicKeyByUsername);

module.exports = router;