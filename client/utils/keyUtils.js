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

  const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);

  return {
    encryptedPrivateKey: btoa(String.fromCharCode(...combined)),
    saltBase64: btoa(String.fromCharCode(...salt)),
  };
}
