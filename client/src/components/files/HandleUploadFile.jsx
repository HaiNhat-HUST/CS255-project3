import { useState, useRef, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import 'crypto-js/lib-typedarrays'; // Ensure typed array support

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
        console.error('Error fetching public key:', err.message);
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
      if (!fileContent || fileContent.byteLength === 0) {
        throw new Error('File content is empty or invalid');
      }

      const fsk = CryptoJS.lib.WordArray.random(32); // 256-bit key
      const iv = CryptoJS.lib.WordArray.random(12); // 12 bytes for GCM
      const wordArray = CryptoJS.lib.WordArray.create(fileContent);

      const encrypted = CryptoJS.AES.encrypt(wordArray, fsk, {
        iv: iv,
        mode: CryptoJS.mode.GCM, // No padding for GCM
      });

      const encryptedData = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(userPublicKey);
      const fskBase64 = fsk.toString(CryptoJS.enc.Base64);
      const fskEncrypted = encrypt.encrypt(fskBase64);
      if (!fskEncrypted) {
        throw new Error('RSA encryption of FSK failed');
      }

      const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);

      const formData = new FormData();
      formData.append('encryptedData', encryptedData);
      formData.append('iv', iv.toString(CryptoJS.enc.Base64));
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
      console.error('Upload failed:', error.message, error.stack);
      alert('Upload failed: ' + error.message);
    }
  };

  if (error) return <div>Error: {error}. Please ensure you are logged in and try again.</div>;
  if (!userPublicKey) return <div>Fetching public key...</div>;

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ margin: '10px 0' }} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

export default HandleUploadFile;