import React from 'react';
import { FaSearch, FaFilter, FaFolderPlus, FaUpload } from 'react-icons/fa';

const FileBrowserControls = ({ onSearchChange, onFilter, onCreateFolder, onUploadFile }) => {
  return (
    <div className="file-browser-controls">
      <div className="breadcrumb">Home</div>
      <div className="actions-toolbar">
        <div className="search-filter-group">
          <div className="search-input-container">
            <FaSearch />
            <input
              type="text"
              placeholder="Search files..."
              className="search-input"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="btn-icon" onClick={onFilter} title="Filter">
            <FaFilter />
          </button>
        </div>
        <div className="action-buttons-group">
          <button className="btn btn-outline" onClick={onCreateFolder}>
            <FaFolderPlus /> Create Folder
          </button>
          {/* <button className="btn btn-filled" onClick={onUploadFile}>
            <FaUpload /> Upload File
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default FileBrowserControls;