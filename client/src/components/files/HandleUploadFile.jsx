import { useState, useRef, useEffect } from 'react';
import AES from 'crypto-js/aes';
import { enc, lib, mode, pad } from 'crypto-js';
import JSEncrypt from 'jsencrypt';

const HandleUploadFile = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOrGeneratePublicKey = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch('http://localhost:5001/api/user/public-key', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setUserPublicKey(data.userPublicKey);
      } catch (err) {
        console.error('Error fetching or generating public key:', err.message);
        setError(err.message);
      }
    };
    fetchOrGeneratePublicKey();
  }, []);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload!');
      return;
    }
    if (!userPublicKey) {
      alert('Cannot upload: Public key not available');
      return;
    }
    try {
      const fileContent = await file.arrayBuffer();
      const fsk = lib.WordArray.random(32); // Sửa: dùng lib thay vì CryptoJS.lib
      const iv = lib.WordArray.random(12); // Sửa: dùng lib thay vì CryptoJS.lib
      const wordArray = lib.WordArray.create(fileContent); // Sửa: dùng lib thay vì CryptoJS.lib
      
      const encrypted = AES.encrypt(wordArray, fsk, {
        iv: iv,
        mode: mode.GCM,
        padding: pad.Pkcs7,
      });
      
      const encryptedData = encrypted.ciphertext.toString(enc.Base64); // Sửa: dùng enc thay vì CryptoJS.enc
      const authTag = encrypted.tag.toString(enc.Base64); // Lấy authTag từ encrypted.tag
      
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(userPublicKey);
      const fskEncrypted = encrypt.encrypt(fsk.toString(enc.Base64));
    
      const hash = enc.SHA256(wordArray).toString(enc.Hex); // Sửa: dùng enc thay vì CryptoJS.enc

      const formData = new FormData();
      formData.append('encryptedData', encryptedData);
      formData.append('iv', iv.toString(enc.Base64));
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

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      alert('File uploaded successfully! File ID: ' + data.file.fileId);
      if (onUploadSuccess) onUploadSuccess(data.file);
      setFile(null);
      fileInputRef.current.value = null;
    } catch (error) {
      console.error('Upload failed:', error.message);
      alert('Upload failed: ' + error.message);
    }
  };

  if (error) return <div>Error: {error}. Please ensure you are logged in and try again.</div>;
  if (!userPublicKey) return <div>Generating or fetching public key...</div>;

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ margin: '10px 0' }} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

export default HandleUploadFile;