import React, { useState, useEffect } from 'react';
import FileBrowserControls from '../components/files/FileBrowserControls';
import FileGrid from '../components/files/FileGrid';

// Mock data (replace with API call)
const mockFilesData = [
  { id: 'folder1', type: 'folder', name: 'Documents', itemCount: 2 },
  { id: 'folder2', type: 'folder', name: 'Photos', itemCount: 1 },
  { id: 'file1', type: 'file', name: 'presentation_final_v2_really_long_name.pptx', size: '128 MB', date: '2023-10-20' },
  { id: 'file2', type: 'file', name: 'archive.zip', size: '25 MB', date: '2023-10-18' },
  { id: 'folder3', type: 'folder', name: 'source_code', itemCount: 1 },
  { id: 'file3', type: 'file', name: 'project_report.pdf', size: '2.5 MB', date: '2023-10-15' },
  { id: 'file4', type: 'file', name: 'logo.png', size: '350 KB', date: '2023-10-12' },
  { id: 'file5', type: 'file', name: 'notes.txt', size: '10 KB', date: '2023-10-10' },
];


const MyFilesPage = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate fetching data
    // In a real app, fetch from your API here
    setItems(mockFilesData);
  }, []);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    // Basic client-side filtering for demo
    if (!term) {
      setItems(mockFilesData);
    } else {
      const filtered = mockFilesData.filter(item =>
        item.name.toLowerCase().includes(term.toLowerCase())
      );
      setItems(filtered);
    }
  };

  const handleFilter = () => alert('Filter clicked!');
  const handleCreateFolder = () => alert('Create Folder clicked!');
  const handleUploadFile = () => alert('Upload File clicked!');

  return (
    <>
      <div className="page-header">
        <h1>My Files</h1>
        <p>Browse, upload, and manage your files and folders.</p>
      </div>

      <FileBrowserControls
        onSearchChange={handleSearchChange}
        onFilter={handleFilter}
        onCreateFolder={handleCreateFolder}
        onUploadFile={handleUploadFile}
      />

      <FileGrid items={items} />
    </>
  );
};

export default MyFilesPage;