import React, { useState, useEffect } from 'react';
import FileBrowserControls from '../components/files/FileBrowserControls';
import FileGrid from '../components/files/FileGrid';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

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
  const HandleUploadFile = () => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Lấy khóa công khai RSA của người dùng (giả định đã tạo và lưu trong localStorage)
  const userPublicKey = localStorage.getItem('userPublicKey'); // Ví dụ: RSA public key
  if (!userPublicKey) {
    console.error('No public key found. Please generate or load it.');
    return <div>Error: No public key available.</div>;
  }

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUploadFile = async () => {
    if (!file) {
      alert('Please select a file to upload!');
      return;
    }

    try {
      // Đọc nội dung file
      const fileContent = await file.arrayBuffer();

      // Bước 1: Tạo File Symmetric Key (FSK) ngẫu nhiên (256-bit)
      const fsk = CryptoJS.lib.WordArray.random(32); // 256-bit key

      // Bước 2: Mã hóa file bằng AES-256-GCM
      const iv = CryptoJS.lib.WordArray.random(12); // IV 96-bit (12 bytes) cho GCM
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(fileContent), fsk, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      });
      const encryptedData = encrypted.ciphertext.toString(CryptoJS.enc.Base64); // F_en
      const authTag = encrypted.authTag.toString(CryptoJS.enc.Base64); // Authentication Tag

      // Bước 3: Mã hóa FSK bằng RSA với khóa công khai của người dùng
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(userPublicKey);
      const fskEncrypted = encrypt.encrypt(fsk.toString(CryptoJS.enc.Base64)); // FSK_encrypted

      // Bước 4: Tính hash SHA-256 của file gốc
      const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileContent)).toString(CryptoJS.enc.Hex);

      // Tạo FormData để gửi lên server
      const formData = new FormData();
      formData.append('encryptedData', encryptedData); // F_en
      formData.append('iv', iv.toString(CryptoJS.enc.Base64)); // IV
      formData.append('authTag', authTag); // AuthTag
      formData.append('fskEncrypted', fskEncrypted); // FSK_encrypted
      formData.append('hash', hash); // F_hash
      formData.append('originalFilename', file.name); // Metadata
      formData.append('mimeType', file.type);
      formData.append('size', file.size);
      formData.append('folderId', ''); // Nếu có folderId, thay bằng giá trị thực
      formData.append('accessControlList', JSON.stringify([
        { userId: 'user123', permission: 'read' },
        { userId: 'user456', permission: 'write' },
      ]));

      // Gửi lên Backend
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('File uploaded successfully:', data);
      alert('File uploaded successfully! File ID: ' + data.file.fileId);
    } catch (error) {
      console.error('Upload failed:', error.message);
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ margin: '10px 0' }} />
      <button onClick={handleUploadFile}>Upload File</button>
    </div>
  );
};
  
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