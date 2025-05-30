// src/components/files/UploadModal.jsx
import React, { useState } from 'react';
import * as cryptoUtils from '../../utils/cryptoUtils';
import * as keyManager from '../../services/keyManager';
import api from '../../services/api';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
        setSelectedFile(event.target.files[0]);
    } else {
        setSelectedFile(null);
    }
    setError('');
    setStatus('');
  };

  const resetForm = () => {
      setSelectedFile(null);
      document.getElementById('file-upload-input').value = ''; // Clear file input
      setError('');
      setStatus('');
      setIsUploading(false);
  };

  const proceedWithUpload = async (userPublicKey) => {
    // ... (The detailed crypto and FormData logic from the previous response)
    // This includes: generate FSK, read file, hash, encrypt content, encrypt FSK, prepare FormData
    // Ensure no 'folderId' is appended to FormData.
    // ... (Copied from your confirmed working version or the one before this)
    if (!selectedFile || !userPublicKey) {
        setError('File or user public key missing.');
        setIsUploading(false);
        setStatus('');
        return;
    }
    try {
        setStatus('Generating file key...');
        const fsk = await cryptoUtils.generateAESKey();
        setStatus('Reading file...');
        const originalFileBuffer = await selectedFile.arrayBuffer();
        setStatus('Calculating file hash...');
        const fileHash = await cryptoUtils.calculateFileHash(originalFileBuffer);
        setStatus('Encrypting file content...');
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const { encryptedBuffer: fen, authTagBuffer } = await cryptoUtils.encryptAES_GCM(fsk, iv, originalFileBuffer);
        setStatus('Encrypting file key...');
        const fskRawBuffer = await cryptoUtils.exportAESKeyRaw(fsk);
        const fskEncryptedBuffer = await cryptoUtils.encryptDataRSA(userPublicKey, fskRawBuffer);
        setStatus('Preparing to send...');
        const formData = new FormData();
        formData.append('encryptedFileBlob', new Blob([fen]), selectedFile.name + ".enc");
        formData.append('originalName', selectedFile.name);
        formData.append('fileSize', selectedFile.size.toString());
        formData.append('mimeType', selectedFile.type || 'application/octet-stream');
        formData.append('initializationVector', cryptoUtils.arrayBufferToBase64(iv));
        formData.append('authenticationTag', cryptoUtils.arrayBufferToBase64(authTagBuffer));
        formData.append('fileHash', fileHash);
        formData.append('encryptedFileSymmetricKey', cryptoUtils.arrayBufferToBase64(fskEncryptedBuffer));

        setStatus('Uploading file...');
        const response = await api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: pe => {
                if (pe.total) setStatus(`Uploading: ${Math.round((pe.loaded * 100) / pe.total)}%`);
                else setStatus(`Uploading: ${Math.round(pe.loaded / 1024)}KB`);
            }
        });
        setStatus('Upload successful! File: ' + response.data.file.originalName);
        if (onUploadSuccess) onUploadSuccess(response.data.file);
        // resetForm(); // Optionally reset form fields here
        // onClose(); // Optionally close modal
    } catch (err) {
        console.error('Upload failed:', err);
        setError(err.response?.data?.message || err.message || 'An unknown error occurred during upload.');
        setStatus('');
    } finally {
        setIsUploading(false);
    }
  };

  const initiateUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file.');
      return;
    }
    setIsUploading(true);
    setError('');
    setStatus('Preparing file...');
    try {
      const userPublicKey = await keyManager.getUserPublicKey();
      if (!userPublicKey) {
        setError("User's public key is not available. Please set up your security keys.");
        setIsUploading(false);
        setStatus('');
        return;
      }
      await proceedWithUpload(userPublicKey);
    } catch (err) {
      console.error('Key preparation for upload failed:', err);
      setError(err.message || 'Failed to prepare for upload. Check your key setup.');
      setStatus('');
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay}>
        <div className="modal-content" style={styles.content}>
            <h2>Upload Encrypted File</h2>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {status && <p>Status: {status}</p>}
            <div style={styles.formGroup}>
                <label htmlFor="file-upload-input">Select File:</label>
                <input id="file-upload-input" type="file" onChange={handleFileChange} disabled={isUploading} style={{display: 'block', marginTop: '5px'}}/>
            </div>
            <div style={styles.buttonGroup}>
                <button onClick={initiateUpload} disabled={isUploading || !selectedFile} style={styles.buttonPrimary}>
                    {isUploading ? 'Processing...' : 'Encrypt & Upload'}
                </button>
                <button onClick={() => { resetForm(); onClose(); }} disabled={isUploading} style={styles.buttonSecondary}>Cancel</button>
            </div>
        </div>
    </div>
  );
};

const styles = { /* ... your modal styles ... */ };
export default UploadModal;