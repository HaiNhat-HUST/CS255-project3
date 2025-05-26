import React from 'react';
import { FaFolder } from 'react-icons/fa';

const FolderItem = ({ name, itemCount }) => {
  return (
    <div className="item-card">
      <FaFolder className="item-icon folder" />
      <div className="item-info">
        <div className="item-name">{name}</div>
        <div className="item-meta">{itemCount} items</div>
      </div>
    </div>
  );
};

export default FolderItem;