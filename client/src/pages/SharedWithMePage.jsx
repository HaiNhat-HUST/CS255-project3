import React, { useState, useEffect } from 'react';
import { FaShareAlt } from 'react-icons/fa';
// You would import FileItem and FolderItem if you were listing shared items
// import FileItem from '../components/files/FileItem';
// import FolderItem from '../components/files/FolderItem';
// import FileGrid from '../components/files/FileGrid';

const SharedWithMePage = () => {
  const [sharedItems, setSharedItems] = useState([]); //  Initialize as empty

  useEffect(() => {
    // Simulate fetching shared items.
    // For now, we'll keep it empty to show the empty state.
    // In a real app, fetch from API:
    // fetch('/api/share/shared-with-me')
    //   .then(res => res.json())
    //   .then(data => setSharedItems(data.items || []));
    setSharedItems([]); // Explicitly empty for demo
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Shared With Me</h1>
        <p>Files and folders shared with you by others.</p>
      </div>

      {sharedItems.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <FaShareAlt />
          </div>
          <h2 className="empty-state-title">Nothing Shared Yet</h2>
          <p className="empty-state-message">
            When others share files or folders with you, they will appear here.
          </p>
        </div>
      ) : (
        <div>
          {/* 
            If you have shared items, you'd render them here,
            possibly using a similar FileGrid component as in MyFilesPage.
            Example: <FileGrid items={sharedItems} />
          */}
          <p>You have {sharedItems.length} items shared with you.</p>
          {/* Implement logic to display shared items */}
        </div>
      )}
    </>
  );
};

export default SharedWithMePage;