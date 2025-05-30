// routes/authRoutes.js
const express = require('express');
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserPublicKey, // <--- Add this
    getUserPublicKeyById // <--- Add this
} = require('../controllers/authController'); // Or userController
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.put('/me/public-key', protect, updateUserPublicKey); // <--- New route
router.get('/users/:userId/public-key', protect, getUserPublicKeyById); // <--- New route (protect if needed)


module.exports = router;