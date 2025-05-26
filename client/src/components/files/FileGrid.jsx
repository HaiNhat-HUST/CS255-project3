import React from 'react';
import FolderItem from './FolderItem';
import FileItem from './FileItem';

const FileGrid = ({ items }) => {
  if (!items || items.length === 0) {
    return <p>No files or folders found.</p>;
  }

  return (
    <div className="file-grid">
      {items.map((item) =>
        item.type === 'folder' ? (
          <FolderItem
            key={item.id}
            name={item.name}
            itemCount={item.itemCount}
          />
        ) : (
          <FileItem
            key={item.id}
            name={item.name}
            size={item.size}
            date={item.date}
          />
        )
      )}
    </div>
  );
};

export default FileGrid;