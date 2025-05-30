// src/components/files/FileItem.jsx
import React, { useState, useEffect } from 'react';
import * as cryptoUtils from '../../utils/cryptoUtils';
import * as keyManager from '../../services/keyManager';
import api from '../../services/api';
import PassphraseModal from '../common/PassphraseModal'; // Ensure path is correct
import { FaDownload, FaEye, FaFileArchive, FaFileImage, FaFilePdf, FaFileCode, FaRegFileAlt, FaFolder } from 'react-icons/fa';

// Ensure this function is defined or imported
const getFileIconAndStyle = (filename) => {
  const extension = filename ? filename.split('.').pop().toLowerCase() : '';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) return <FaFileArchive className="item-icon archive" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension)) return <FaFileImage className="item-icon image" />;
  if (['pdf'].includes(extension)) return <FaFilePdf className="item-icon document" />;
  if (['doc', 'docx', 'odt', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'txt', 'md', 'rtf'].includes(extension)) return <FaRegFileAlt className="item-icon document" />;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'xml', 'sh'].includes(extension)) return <FaFileCode className="item-icon code" />;
  return <FaRegFileAlt className="item-icon generic" />;
};

const isMimeTypeViewable = (mimeType) => {
  if (!mimeType) return false;
  const viewableTypes = [
    'image/', 'application/pdf', 'text/plain', 'text/html', 'text/xml', 'application/json',
    // Browsers often render these directly:
    'text/javascript', 'text/css', 
  ];
  const lowerMimeType = mimeType.toLowerCase();
  return viewableTypes.some(viewable => lowerMimeType.startsWith(viewable) || lowerMimeType === viewable);
};

const FileItem = ({ file /* onAction - if you add more actions like delete/share */ }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingError, setProcessingError] = useState('');
  const [isPassphraseModalOpen, setIsPassphraseModalOpen] = useState(false);
  const [fileToProcessMeta, setFileToProcessMeta] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [objectUrls, setObjectUrls] = useState([]);

  useEffect(() => {
    return () => { // Cleanup object URLs on unmount
      objectUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [objectUrls]);

  const initiateFileAction = async (type) => {
    setActionType(type);
    setProcessingStatus(`Preparing to ${type}...`);
    setProcessingError('');
    setIsProcessing(true);
    try {
      const metaResponse = await api.get(`/files/${file._id}/prepare-download`);
      setFileToProcessMeta(metaResponse.data);
      setIsPassphraseModalOpen(true);
      // Note: setIsProcessing(false) will be handled after passphrase modal or if prep fails
    } catch (err) {
      console.error(`Prepare ${type} failed:`, err);
      setProcessingError(err.response?.data?.message || err.message || `Failed to prepare for ${type}.`);
      setProcessingStatus('');
      setIsProcessing(false); // Reset on immediate failure
    }
  };

  const handlePassphraseSubmit = async (passphrase) => {
    setIsPassphraseModalOpen(false);
    if (!fileToProcessMeta || !passphrase || !actionType) {
      setProcessingError(`${actionType || 'Action'} cancelled or data missing.`);
      setIsProcessing(false);
      setProcessingStatus('');
      return;
    }
    // setIsProcessing(true); // Already true from initiateFileAction
    setProcessingStatus('Authenticating key...');
    try {
      const userPrivateKey = await keyManager.loadAndDecryptPrivateKeyFromStorage(passphrase);
      if (!userPrivateKey) throw new Error("Could not load private key. Invalid passphrase?");

      setProcessingStatus('Decrypting file key...');
      const fskEncryptedBuffer = cryptoUtils.base64ToArrayBuffer(fileToProcessMeta.encryptedFileSymmetricKey);
      const fskRawBuffer = await cryptoUtils.decryptDataRSA(userPrivateKey, fskEncryptedBuffer);
      const fsk = await cryptoUtils.importAESKeyRaw(fskRawBuffer);

      setProcessingStatus(`Downloading encrypted content for ${actionType}...`);
      const blobResponse = await api.get(`/files/blobs/${fileToProcessMeta.encryptedName}`, {
        responseType: 'arraybuffer',
        onDownloadProgress: pe => {
          if (pe.total) setProcessingStatus(`Downloading: ${Math.round((pe.loaded * 100) / pe.total)}%`);
          else setProcessingStatus(`Downloading: ${Math.round(pe.loaded / 1024)}KB`);
        }
      });
      const encryptedFileArrayBuffer = blobResponse.data;

      setProcessingStatus('Decrypting file content...');
      const ivBuffer = cryptoUtils.base64ToArrayBuffer(fileToProcessMeta.initializationVector);
      const authTagBuffer = cryptoUtils.base64ToArrayBuffer(fileToProcessMeta.authenticationTag);
      const decryptedFileBuffer = await cryptoUtils.decryptAES_GCM(fsk, ivBuffer, authTagBuffer, encryptedFileArrayBuffer);

      if (fileToProcessMeta.fileHash) {
        setProcessingStatus('Verifying integrity...');
        const calculatedHash = await cryptoUtils.calculateFileHash(decryptedFileBuffer);
        if (calculatedHash !== fileToProcessMeta.fileHash) {
          console.warn("Integrity check warning: Hashes do not match.", { serverHash: fileToProcessMeta.fileHash, clientHash: calculatedHash });
          setProcessingStatus(`Warning: Integrity mismatch. Proceeding to ${actionType}.`);
        } else {
          setProcessingStatus(`Integrity verified. Proceeding to ${actionType}.`);
        }
      } else {
        setProcessingStatus(`Decryption complete. Proceeding to ${actionType}.`);
      }

      const blob = new Blob([decryptedFileBuffer], { type: fileToProcessMeta.mimeType });
      const objectUrl = URL.createObjectURL(blob);

      if (actionType === 'view' && isMimeTypeViewable(fileToProcessMeta.mimeType)) {
        setObjectUrls(prev => [...prev, objectUrl]); // Store for cleanup
        window.open(objectUrl, '_blank');
        // Don't revoke objectUrl immediately for viewing
        setProcessingStatus(`File '${fileToProcessMeta.originalName}' opened for viewing.`);
      } else { // Download
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileToProcessMeta.originalName || file.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl); // Revoke immediately for download
        setProcessingStatus(`File '${fileToProcessMeta.originalName}' download started.`);
      }
    } catch (err) {
      console.error(`${actionType} process failed:`, err);
      setProcessingError(err.message || `${actionType} failed during processing.`);
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
      setFileToProcessMeta(null);
      setActionType(null);
    }
  };

  const handleClosePassphraseModal = () => {
    setIsPassphraseModalOpen(false);
    setIsProcessing(false); // Reset processing state if modal is cancelled
    setProcessingStatus('');
    setProcessingError('');
    setFileToProcessMeta(null);
    setActionType(null);
  };

  return (
    <>
      <div className="item-card">
        {getFileIconAndStyle(file.originalName)}
        <div className="item-info">
          <div className="item-name" title={file.originalName}>{file.originalName}</div>
          <div className="item-meta">
            {`${(file.fileSize / 1024).toFixed(1)} KB`} • {new Date(file.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="item-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {isMimeTypeViewable(file.mimeType) && (
            <button onClick={() => initiateFileAction('view')} disabled={isProcessing} title="View File" className="action-btn"> <FaEye /> </button>
          )}
          <button onClick={() => initiateFileAction('download')} disabled={isProcessing} title="Download File" className="action-btn"> <FaDownload /> </button>
          {/* Example: <button onClick={() => onAction && onAction('delete', file._id)} disabled={isProcessing} title="Delete File" className="action-btn"><FaTrash /></button> */}
        </div>
      </div>
      {(processingStatus || processingError) && (
        <div className="item-status-display"> {/* Add CSS for this class */}
          {processingStatus && <p className="status-text">{processingStatus}</p>}
          {processingError && <p className="error-text">{processingError}</p>}
        </div>
      )}
      <PassphraseModal
        isOpen={isPassphraseModalOpen}
        onClose={handleClosePassphraseModal}
        onSubmit={handlePassphraseSubmit}
        title={`Unlock File to ${actionType || 'process'}`}
        message={`Enter your key passphrase to ${actionType || 'process'} "${fileToProcessMeta?.originalName || file.originalName}".`}
      />
    </>
  );
};

export default FileItem;