import React from 'react';
import { FaFileArchive, FaFileImage, FaFilePdf, FaFileCode, FaRegFileAlt } from 'react-icons/fa';

const getFileIconAndStyle = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  if (['zip', 'rar', 'tar', 'gz'].includes(extension)) {
    return <FaFileArchive className="item-icon archive" />;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
    return <FaFileImage className="item-icon image" />;
  }
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(extension)) {
    return <FaFilePdf className="item-icon document" />; // Using PDF icon for most documents
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css'].includes(extension)) {
    return <FaFileCode className="item-icon code" />;
  }
  return <FaRegFileAlt className="item-icon generic" />;
};

const FileItem = ({ name, size, date }) => {
  return (
    <div className="item-card">
      {getFileIconAndStyle(name)}
      <div className="item-info">
        <div className="item-name" title={name}>{name}</div>
        <div className="item-meta">
          {size} • {new Date(date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default FileItem;