const express = require('express');
const router = express.Router();
const { getUserPublicKey, getUserPublicKeyByUsername } = require('../controllers/userController'); // Sửa tên hàm
const { protect } = require('../middleware/authMiddleware.js'); // Import protect

console.log('protect:', typeof protect); // Kiểm tra
console.log('getUserPublicKey:', typeof getUserPublicKey); // Kiểm tra
console.log('getUserPublicKeyByUsername:', typeof getUserPublicKeyByUsername); // Kiểm tra

router.get('/public-key', protect, getUserPublicKey); // Sử dụng protect và getUserPublicKey
router.get('/public-key/:username', protect, getUserPublicKeyByUsername); // Thêm route nếu cần
// Bỏ route generateAndSavePublicKey nếu không cần, hoặc định nghĩa lại trong userController.js

module.exports = router;