// src/utils/keyUtils.js

export async function generateUserKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportKeyToPEM = async (key, format) => {
    const exported = await window.crypto.subtle.exportKey(format, key);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    const type = format === 'pkcs8' ? 'PRIVATE' : 'PUBLIC';
    return `-----BEGIN ${type} KEY-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END ${type} KEY-----`;
  };

  const publicKeyPem = await exportKeyToPEM(keyPair.publicKey, 'spki');
  const privateKeyPem = await exportKeyToPEM(keyPair.privateKey, 'pkcs8');

  return { publicKeyPem, privateKeyPem };
}

export async function encryptPrivateKeyWithPassphrase(privateKeyPem, passphrase) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  const passKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(privateKeyPem)
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  return {
    encryptedPrivateKey: btoa(String.fromCharCode(...combined)),
    saltBase64: btoa(String.fromCharCode(...salt)),
  };
}

// export async function decryptPrivateKeyWithPassphrase(encryptedBase64, saltBase64, passphrase) {
//   const enc = new TextEncoder();
//   const dec = new TextDecoder();

//   const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
//   const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

//   const iv = encryptedBytes.slice(0, 12);
//   const data = encryptedBytes.slice(12);

//   const keyMaterial = await window.crypto.subtle.importKey(
//     'raw',
//     enc.encode(passphrase),
//     { name: 'PBKDF2' },
//     false,
//     ['deriveKey']
//   );

//   const aesKey = await window.crypto.subtle.deriveKey(
//     {
//       name: 'PBKDF2',
//       salt,
//       iterations: 100000,
//       hash: 'SHA-256',
//     },
//     keyMaterial,
//     { name: 'AES-GCM', length: 256 },
//     false,
//     ['decrypt']
//   );

//   const decrypted = await window.crypto.subtle.decrypt(
//     { name: 'AES-GCM', iv },
//     aesKey,
//     data
//   );

//   return dec.decode(decrypted);
// }
