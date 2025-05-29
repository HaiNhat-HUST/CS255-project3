import { useState, useRef, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

const HandleUploadFile = ({ onUploadSuccess }) => {
  console.log('handleUpload called');
  const [file, setFile] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState(null); // State để lưu public key
  const [error, setError] = useState(null); // State để lưu lỗi
  const fileInputRef = useRef(null);

  // Lấy public key từ server khi component mount
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const token = localStorage.getItem('token'); // Giả định token được lưu trong localStorage
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5001/api/user/public-key', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Gửi token xác thực
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.userPublicKey) {
          throw new Error('Public key not found on server');
        }

        setUserPublicKey(data.userPublicKey);
      } catch (err) {
        console.error('Error fetching public key:', err.message);
        setError(err.message);
      }
    };

    fetchPublicKey();
  }, []); // Chỉ gọi 1 lần khi component mount

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

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`, // Gửi token xác thực
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('File uploaded successfully:', data);
      alert('File uploaded successfully! File ID: ' + data.file.fileId);

      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }

      setFile(null);
      fileInputRef.current.value = null;
    } catch (error) {
      console.error('Upload failed:', error.message);
      alert('Upload failed: ' + error.message);
    }
  };

  // Hiển thị lỗi nếu không lấy được public key
  if (error) {
    return <div>Error: {error}. Please ensure you are logged in and have a public key.</div>;
  }

  // Hiển thị loading nếu chưa lấy được public key
  if (!userPublicKey) {
    return <div>Loading public key...</div>;
  }

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={onFileChange} style={{ margin: '10px 0' }} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
};

export default HandleUploadFile;