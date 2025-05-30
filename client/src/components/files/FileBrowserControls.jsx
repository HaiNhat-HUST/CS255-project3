// src/components/files/FileBrowserControls.js
import React, { useState } from 'react';
import { FaSearch, FaFilter, /* FaFolderPlus, */ FaUpload } from 'react-icons/fa'; // FaFolderPlus commented
import UploadModal from './UploadModal';

// currentFolderId prop removed if it was only for folder creation context
const FileBrowserControls = ({ onSearchChange, onFilter, onFileUploaded }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadFileClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (uploadedFile) => {
    setIsUploadModalOpen(false);
    if (onFileUploaded) {
      onFileUploaded(uploadedFile);
    }
  };

  return (
    <>
      <div className="file-browser-controls">
        <div className="breadcrumb">Home</div> {/* Breadcrumb might become static "Home" or removed */}
        <div className="actions-toolbar">
          <div className="search-filter-group">
            <div className="search-input-container">
              <FaSearch />
              <input
                type="text"
                placeholder="Search files..."
                className="search-input"
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
            </div>
            <button className="btn-icon" onClick={onFilter} title="Filter">
              <FaFilter />
            </button>
          </div>
          <div className="action-buttons-group">
            {/* <button className="btn btn-outline" onClick={onCreateFolder}>
              <FaFolderPlus /> Create Folder 
            </button> // Commented out */}
            <button className="btn btn-filled" onClick={handleUploadFileClick}>
              <FaUpload /> Upload File
            </button>
          </div>
        </div>
      </div>
      {isUploadModalOpen && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          // currentFolderId prop removed from UploadModal call
        />
      )}
    </>
  );
};

export default FileBrowserControls;