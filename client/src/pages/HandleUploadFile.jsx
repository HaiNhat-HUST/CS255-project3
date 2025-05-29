import { useState, useRef } from 'react';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

const HandleUploadFile = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const userPublicKey = localStorage.getItem('userPublicKey');
  if (!userPublicKey) {
    console.error('No public key found. Please generate or load it.');
    return <div>Error: No public key available.</div>;
  }

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload!');
      return;
    }

    try {
      const fileContent = await file.arrayBuffer();
      const fsk = CryptoJS.lib.WordArray.random(32);
      const iv = CryptoJS.lib.WordArray.random(12);
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(fileContent), fsk, {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      });
      const encryptedData = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
      const authTag = encrypted.authTag.toString(CryptoJS.enc.Base64);

      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(userPublicKey);
      const fskEncrypted = encrypt.encrypt(fsk.toString(CryptoJS.enc.Base64));

      const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(fileContent)).toString(CryptoJS.enc.Hex);

      const formData = new FormData();
      formData.append('encryptedData', encryptedData);
      formData.append('iv', iv.toString(CryptoJS.enc.Base64));
      formData.append('authTag', authTag);
      formData.append('fskEncrypted', fskEncrypted);
      formData.append('hash', hash);
      formData.append('originalFilename', file.name);
      formData.append('mimeType', file.type);
      formData.append('size', file.size);
      formData.append('folderId', '');
      formData.append('accessControlList', JSON.stringify([
        { userId: 'user123', permission: 'read' },
        { userId: 'user456', permission: 'write' },
      ]));

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

      // Gọi callback để thông báo upload thành công (nếu cần cập nhật danh sách file)
      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }

      // Reset file input
      setFile(null);
      fileInputRef.current.value = null;
    } catch (error) {
      console.error('Upload failed:', error.message);
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ margin: '10px 0' }} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

export default HandleUploadFile;