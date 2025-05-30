// src/pages/MyFilesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as keyManager from '../services/keyManager';
import FileBrowserControls from '../components/files/FileBrowserControls';
import FileGrid from '../components/files/FileGrid';
import KeySetupModal from '../components/auth/KeySetupModal';
import api from '../services/api';

const MyFilesPage = () => {
  const { userInfo, isAuthenticated, updateUserProfile } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeySetupModalOpen, setIsKeySetupModalOpen] = useState(false);
  const [pageError, setPageError] = useState('');

  const fetchFiles = async () => {
    setIsLoading(true);
    setPageError('');
    try {
      const response = await api.get('/files'); // Backend should return root files
      setFiles(response.data.files || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      setPageError(error.response?.data?.message || error.message || "Could not load files.");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      const localPKExists = keyManager.hasLocalPrivateKey();
      if (!userInfo?.userPublicKey && !localPKExists) {
        setIsKeySetupModalOpen(true);
      } else if (userInfo?.userPublicKey && !localPKExists) {
        setPageError("Security Alert: Your private key is not found locally on this device. You can upload new files, but you won't be able to download/view existing ones until you set up your keys on this device. Re-setting up keys will make prior data inaccessible without the original key passphrase.");
      }
    } else {
      setFiles([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userInfo?.userPublicKey]); // Rerun if auth or publicKey status changes

  const handleFileUploaded = (newUploadedFile) => {
    fetchFiles(); // Re-fetch the list to include the new file and ensure consistency
  };

  const handleKeySetupModalClose = async () => {
    setIsKeySetupModalOpen(false);
    if (isAuthenticated) {
        try {
            const response = await api.get('/auth/me'); // Fetch updated profile
            // Assuming login can also be used to update context or have a dedicated update
            const { token } = userInfo; // Keep existing token from AuthContext
            updateUserProfile({ ...response.data, token }); // Update AuthContext
        } catch (err) {
            console.error("Failed to refresh user profile after key setup", err);
            setPageError("Failed to refresh profile after key setup. Please try logging out and back in.");
        }
        fetchFiles(); // Re-fetch files
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>My Files</h1>
        <p>Browse, upload, and manage your encrypted files.</p>
      </div>
      {pageError && <p className="page-error-banner">{pageError}</p>} {/* Add CSS for .page-error-banner */}

      <FileBrowserControls onFileUploaded={handleFileUploaded} />

      {isLoading ? (
        <p>Loading your encrypted files...</p>
      ) : (
        <FileGrid items={files} /> // FileGrid now only expects file items
      )}

      <KeySetupModal isOpen={isKeySetupModalOpen} onClose={handleKeySetupModalClose} />
    </>
  );
};
export default MyFilesPage;