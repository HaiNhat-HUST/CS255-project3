
// // controllers/shareController.js
// const ShareToken = require('../models/ShareToken');
// const File = require('../models/File');
// const Folder = require('../models/Folder');
// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');

// const BCRYPT_SALT_ROUNDS_TOKEN = 10; // Can be different from user password salt

// // Helper to generate a secure token
// const generateShareTokenValue = () => {
//   return crypto.randomBytes(32).toString('hex'); // Generates a 64-character hex string
// };

// // @desc    Create a share token for a file or folder
// // @route   POST /api/share/file/:entityId  OR /api/share/folder/:entityId
// // @access  Private
// exports.createShareToken = async (req, res) => {
//   try {
//     const { entityId } = req.params;
//     const { entityType } = req.body; // Client should specify 'file' or 'folder'
//     const { expiresAt } = req.body; // Optional expiration date string

//     if (!entityType || (entityType !== 'file' && entityType !== 'folder')) {
//         return res.status(400).json({ message: 'Invalid entity type specified.' });
//     }

//     let entity;
//     if (entityType === 'file') {
//       entity = await File.findOne({ _id: entityId, uploader: req.user.id });
//     } else { // entityType === 'folder'
//       entity = await Folder.findOne({ _id: entityId, owner: req.user.id });
//     }

//     if (!entity) {
//       return res.status(404).json({ message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found or access denied.` });
//     }

//     const tokenValue = generateShareTokenValue();
//     const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS_TOKEN);
//     const tokenValueHash = await bcrypt.hash(tokenValue, salt);

//     const newShareToken = new ShareToken({
//       tokenValueHash,
//       entityId: entity._id,
//       entityType,
//       owner: req.user.id,
//       expiresAt: expiresAt ? new Date(expiresAt) : null,
//     });

//     await newShareToken.save();

//     res.status(201).json({
//       message: 'Share token created successfully.',
//       tokenValue, // Send the plain token to the user ONCE
//       tokenDetails: { // Send some details back for the UI
//           _id: newShareToken._id,
//           entityName: entity.originalFilename || entity.name, // Display name
//           entityType: newShareToken.entityType,
//           expiresAt: newShareToken.expiresAt,
//           createdAt: newShareToken.createdAt,
//           status: newShareToken.status
//       }
//     });
//   } catch (error) {
//     console.error('Create Share Token Error:', error);
//     if (error.kind === 'ObjectId') {
//         return res.status(404).json({ message: 'Entity not found (invalid ID format)' });
//     }
//     res.status(500).json({ message: 'Server error creating share token', error: error.message });
//   }
// };

// // @desc    List share tokens created by the user
// // @route   GET /api/share/tokens
// // @access  Private
// exports.listUserShareTokens = async (req, res) => {
//   try {
//     const tokens = await ShareToken.find({ owner: req.user.id })
//       .sort({ createdAt: -1 })
//       .lean(); // Use .lean() for performance if not modifying

//     // Populate entityName for better UI display
//     const populatedTokens = await Promise.all(tokens.map(async (token) => {
//         let entityName = 'N/A';
//         if (token.entityType === 'file') {
//             const file = await File.findById(token.entityId).select('originalFilename').lean();
//             if (file) entityName = file.originalFilename;
//         } else if (token.entityType === 'folder') {
//             const folder = await Folder.findById(token.entityId).select('name').lean();
//             if (folder) entityName = folder.name;
//         }
//         return { ...token, entityName }; // Add entityName to the token object
//     }));


//     res.json(populatedTokens);
//   } catch (error) {
//     console.error('List Share Tokens Error:', error);
//     res.status(500).json({ message: 'Server error listing share tokens', error: error.message });
//   }
// };

// // @desc    Revoke a share token
// // @route   PUT /api/share/tokens/:tokenId/revoke
// // @access  Private
// exports.revokeShareToken = async (req, res) => {
//   try {
//     const { tokenId } = req.params;
//     const token = await ShareToken.findOne({ _id: tokenId, owner: req.user.id });

//     if (!token) {
//       return res.status(404).json({ message: 'Token not found or access denied.' });
//     }

//     if (token.status === 'revoked') {
//         return res.status(400).json({ message: 'Token is already revoked.'});
//     }
//     if (token.status === 'expired' && token.expiresAt && new Date(token.expiresAt) < new Date()) {
//         // If already expired, could just confirm, or update status if it wasn't marked yet
//         token.status = 'expired'; // Ensure it's marked if not already
//     } else {
//         token.status = 'revoked';
//     }
//     await token.save();

//     res.json({ message: 'Token revoked successfully.', status: token.status });
//   } catch (error) {
//     console.error('Revoke Share Token Error:', error);
//     if (error.kind === 'ObjectId') {
//         return res.status(404).json({ message: 'Token not found (invalid ID format)' });
//     }
//     res.status(500).json({ message: 'Server error revoking token', error: error.message });
//   }
// };

// // @desc    Access shared entity metadata using a token
// // @route   GET /api/share/access/:tokenValue
// // @access  Public (or semi-public, token itself is the auth)
// exports.accessSharedEntity = async (req, res) => {
//     try {
//         const { tokenValue } = req.params;

//         // Find token by hashing the provided value and comparing (more secure)
//         // This requires iterating through tokens or a more complex lookup if not indexed.
//         // For simplicity now, if you don't hash tokens in DB, you'd find directly.
//         // Assuming tokens are hashed in DB:
//         const allTokens = await ShareToken.find({ status: 'active' }).lean(); // Get all active tokens
//         let foundToken = null;

//         for (const token of allTokens) {
//             // Note: bcrypt.compare is async. This loop needs to be async or use a library that supports sync compare for this pattern.
//             // Or, better, structure the DB to allow efficient lookup of hashed tokens.
//             // For this example, let's assume we find the token entry that matches the hash of tokenValue.
//             // THIS IS A SIMPLIFICATION. In production, you'd want to query for the hash directly.
//             // One way to handle this is to *not* store the tokenValue plain text even temporarily.
//             // The client would have the tokenValue. The server needs a way to find the *record* associated with this tokenValue.
//             // For now, let's assume we are just searching for the unhashed token for simplicity in this example,
//             // BUT IN PRODUCTION YOU MUST HASH THE TOKEN IN THE DB AND COMPARE HASHES.
//             // For this demo, if we stored the hash, client sends plain tokenValue,
//             // server iterates its ShareToken records, for each one takes tokenValueHash, and compares
//             // using bcrypt.compare(tokenValue, record.tokenValueHash).
//             // We will simulate finding the correct token record based on a direct match for this example,
//             // but acknowledging the security implication of not using the hash for lookup directly.
//         }

//         // Corrected (but still simplified for demo) approach: find by hash
//         // This requires iterating if you don't have a way to query by a salted hash.
//         // A more robust system might use a unique, unhashed but opaque identifier alongside the hashed token.

//         // Simpler approach for demo (less secure than comparing hashes for lookup):
//         // const tokenRecord = await ShareToken.findOne({ tokenValue: tokenValue, status: 'active' });
//         // To make it work with hashed tokens, we must retrieve the record then compare.
//         // Let's assume the client sends the tokenValue, and we need to find the corresponding *hashed* record.
//         // This is hard without iterating if salt is unique per token.
//         // A common pattern is to use the token directly as a lookup key if the token itself is sufficiently random and long (like a UUID).
//         // Let's stick to the hashed value for storage and iterate to find for now.
//         const tokens = await ShareToken.find({ status: 'active' }).lean();
//         let matchedTokenRecord = null;
//         for (const dbToken of tokens) {
//             if (await bcrypt.compare(tokenValue, dbToken.tokenValueHash)) {
//                 matchedTokenRecord = dbToken;
//                 break;
//             }
//         }

//         if (!matchedTokenRecord) {
//             return res.status(404).json({ message: 'Invalid or expired share token.' });
//         }

//         // Check expiration
//         if (matchedTokenRecord.expiresAt && new Date(matchedTokenRecord.expiresAt) < new Date()) {
//             // Optionally update status to 'expired' in DB
//             await ShareToken.findByIdAndUpdate(matchedTokenRecord._id, { status: 'expired' });
//             return res.status(403).json({ message: 'Share token has expired.' });
//         }

//         let entityData;
//         if (matchedTokenRecord.entityType === 'file') {
//             entityData = await File.findById(matchedTokenRecord.entityId)
//                                    .select('originalFilename mimeType size encryptedFilename iv keyEncryptionIv createdAt') // Send necessary info
//                                    .lean();
//             if (entityData) {
//                 // For downloading the shared file via token
//                 entityData.downloadLink = `/api/share/access/${tokenValue}/download`; // Construct a download link
//             }
//         } else { // folder
//             // For folders, list contents (this can get complex with nested sharing)
//             // For now, just return folder info. Listing contents of a shared folder needs more thought.
//             entityData = await Folder.findById(matchedTokenRecord.entityId)
//                                      .select('name createdAt')
//                                      .lean();
//             // If it's a folder, the client might then make requests to list contents of this *shared* folder
//             // which would require another layer of logic or a specific endpoint.
//             // For now, just return the folder metadata.
//         }

//         if (!entityData) {
//             return res.status(404).json({ message: 'Shared entity not found.' });
//         }

//         res.json({
//             entityType: matchedTokenRecord.entityType,
//             entity: entityData,
//             sharedBy: matchedTokenRecord.owner, // Could populate username here
//             sharedAt: matchedTokenRecord.createdAt,
//         });

//     } catch (error) {
//         console.error('Access Shared Entity Error:', error);
//         res.status(500).json({ message: 'Server error accessing shared entity', error: error.message });
//     }
// };


// // @desc    Download a shared file using a token
// // @route   GET /api/share/access/:tokenValue/download
// // @access  Public (token is the auth)
// exports.downloadSharedFile = async (req, res) => {
//     try {
//         const { tokenValue } = req.params;
//         const tokens = await ShareToken.find({ status: 'active', entityType: 'file' }).lean();
//         let matchedTokenRecord = null;
//         for (const dbToken of tokens) {
//             if (await bcrypt.compare(tokenValue, dbToken.tokenValueHash)) {
//                 matchedTokenRecord = dbToken;
//                 break;
//             }
//         }

//         if (!matchedTokenRecord) {
//             return res.status(404).json({ message: 'Invalid or expired share token for file download.' });
//         }

//         if (matchedTokenRecord.expiresAt && new Date(matchedTokenRecord.expiresAt) < new Date()) {
//             await ShareToken.findByIdAndUpdate(matchedTokenRecord._id, { status: 'expired' });
//             return res.status(403).json({ message: 'Share token has expired.' });
//         }

//         const file = await File.findById(matchedTokenRecord.entityId);
//         if (!file) {
//             return res.status(404).json({ message: 'Shared file not found.' });
//         }

//         const filePath = path.join(UPLOADS_DIR, file.encryptedFilename);
//         if (fs.existsSync(filePath)) {
//             res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
//             res.setHeader('Content-Type', file.mimeType);
//             res.download(filePath, file.originalFilename);
//         } else {
//             res.status(404).json({ message: 'File data not found on server.' });
//         }

//     } catch (error) {
//         console.error('Download Shared File Error:', error);
//         res.status(500).json({ message: 'Server error during shared file download', error: error.message });
//     }
// };

