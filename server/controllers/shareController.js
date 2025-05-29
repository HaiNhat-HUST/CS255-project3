const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:fileId/share', authMiddleware, fileController.sharefile);

module.exports = router;
