// routes/shareRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createShareToken,
  listUserShareTokens,
  revokeShareToken,
  accessSharedEntity,
  downloadSharedFile
} = require('../controllers/shareController');

const router = express.Router();

// Note: Using POST for createShareToken to include entityType in body and avoid overly long URLs
router.post('/:entityId', protect, createShareToken);
router.get('/tokens', protect, listUserShareTokens);
router.put('/tokens/:tokenId/revoke', protect, revokeShareToken);
router.get('/access/:tokenValue', accessSharedEntity);
router.get('/access/:tokenValue/download', downloadSharedFile);


module.exports = router;