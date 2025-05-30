// src/components/files/FileGrid.jsx
import React from 'react';
import FileItem from './FileItem';

const FileGrid = ({ items, onFileAction }) => { // items = array of file objects
  if (!items || items.length === 0) {
    return (
        <div className="empty-state-container" style={styles.emptyState}>
            <div className="empty-state-icon" style={styles.emptyStateIcon}>📁</div>
            <h2 className="empty-state-title">No Files Yet</h2>
            <p className="empty-state-message">
                Upload your first encrypted file to see it here.
            </p>
        </div>
    );
  }

  return (
    <div className="file-grid"> {/* Ensure .file-grid CSS is defined */}
      {items.map((file) => (
        <FileItem
          key={file._id}
          file={file} // Pass the whole file object
          // onAction={onFileAction} // If you have general actions like delete/share
        />
      ))}
    </div>
  );
};

const styles = { // Basic inline styles for empty state
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', textAlign: 'center', marginTop: '30px', minHeight: '200px' },
    emptyStateIcon: { fontSize: '3em', marginBottom: '15px', color: '#6c757d' }
};

export default FileGrid;