const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware')


router.get('/:userId/public-key', authMiddleware, userController.getUserPublicKey);

router.get('/:username/public-key', authMiddleware, userController.getUserPublicKey);

module.exports = router