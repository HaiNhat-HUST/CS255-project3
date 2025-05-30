// src/utils/cryptoUtils.js
import forge from 'node-forge'; // For PEM handling and some conversions

// --- Converters ---
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// --- RSA Key Operations ---
const RSA_ALGORITHM = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), // 65537
  hash: 'SHA-256',
};

export async function generateRSAKeyPair() {
  return window.crypto.subtle.generateKey(RSA_ALGORITHM, true, ['encrypt', 'decrypt']);
}

export async function exportPublicKeyAsPEM(key) {
  const exportedSpki = await window.crypto.subtle.exportKey('spki', key);
  const spkiDer = new Uint8Array(exportedSpki);
  const pem = forge.pki.publicKeyToPem(forge.pki.publicKeyFromAsn1(forge.asn1.fromDer(spkiDer.buffer)));
  return pem;
}

export async function importPublicKeyFromPEM(pem) {
  const der = forge.util.decode64(pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|[\n\r])/g, ''));
  return window.crypto.subtle.importKey(
    'spki',
    forge.util.binary.raw.decode(der),
    RSA_ALGORITHM,
    true,
    ['encrypt']
  );
}

export async function exportPrivateKeyAsPKCS8(key) { // Returns ArrayBuffer
  return window.crypto.subtle.exportKey('pkcs8', key);
}

export async function importPrivateKeyFromPKCS8(pkcs8ArrayBuffer) {
  return window.crypto.subtle.importKey(
    'pkcs8',
    pkcs8ArrayBuffer,
    RSA_ALGORITHM,
    true,
    ['decrypt']
  );
}

export async function encryptDataRSA(publicKey, dataBuffer) { // dataBuffer is ArrayBuffer
  return window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    dataBuffer
  );
}

export async function decryptDataRSA(privateKey, encryptedBuffer) { // encryptedBuffer is ArrayBuffer
  return window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedBuffer
  );
}

// --- AES Key Operations (AES-GCM) ---
const AES_ALGORITHM_NAME = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const AES_IV_LENGTH_BYTES = 12; // Standard for GCM

export async function generateAESKey() {
  return window.crypto.subtle.generateKey(
    { name: AES_ALGORITHM_NAME, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportAESKeyRaw(key) { // Returns ArrayBuffer
  return window.crypto.subtle.exportKey('raw', key);
}

export async function importAESKeyRaw(keyBuffer) { // keyBuffer is ArrayBuffer
  return window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: AES_ALGORITHM_NAME, length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAES_GCM(aesKey, ivArrayBuffer, dataArrayBuffer) {
  const encryptedResult = await window.crypto.subtle.encrypt(
    { name: AES_ALGORITHM_NAME, iv: ivArrayBuffer, tagLength: 128 }, // 128-bit auth tag
    aesKey,
    dataArrayBuffer
  );
  // GCM includes the auth tag at the end of the ciphertext by default with Web Crypto for some implementations
  // Or, it might be separate. For clarity, we'll assume it's separate here.
  // Web Crypto API's encrypt for AES-GCM returns ArrayBuffer containing ciphertext + tag.
  // We need to separate them. Tag is last 16 bytes (128 bits).
  const ciphertext = encryptedResult.slice(0, encryptedResult.byteLength - 16);
  const authTag = encryptedResult.slice(encryptedResult.byteLength - 16);
  return { encryptedBuffer: ciphertext, authTagBuffer: authTag };
}


export async function decryptAES_GCM(aesKey, ivArrayBuffer, authTagBuffer, encryptedFileArrayBuffer) {
  // Concatenate ciphertext and authTag for Web Crypto API
  const fullEncryptedBuffer = new Uint8Array(encryptedFileArrayBuffer.byteLength + authTagBuffer.byteLength);
  fullEncryptedBuffer.set(new Uint8Array(encryptedFileArrayBuffer), 0);
  fullEncryptedBuffer.set(new Uint8Array(authTagBuffer), encryptedFileArrayBuffer.byteLength);

  try {
    return await window.crypto.subtle.decrypt(
        { name: AES_ALGORITHM_NAME, iv: ivArrayBuffer, tagLength: 128 },
        aesKey,
        fullEncryptedBuffer.buffer // Pass the combined buffer
    );
  } catch (e) {
      console.error("AES-GCM Decryption failed:", e);
      // This often means the key, IV, authTag, or ciphertext is incorrect/corrupted
      throw new Error("Decryption failed. Data may be corrupted or key is incorrect.");
  }
}

// --- Hashing ---
export async function calculateFileHash(fileArrayBuffer) {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileArrayBuffer);
  return arrayBufferToHex(hashBuffer); // Return as hex string
}

// --- Passphrase-based Key Derivation & Encryption for Private Key ---
const PBKDF2_ITERATIONS = 100000; // Min 100k, ideally more
const PBKDF2_SALT_LENGTH_BYTES = 16;
const PK_ENC_AES_ALGORITHM = 'AES-GCM'; // For encrypting the private key
const PK_ENC_AES_KEY_LENGTH = 256;
const PK_ENC_AES_IV_LENGTH_BYTES = 12;

export async function deriveKeyFromPassphrase(passphrase, salt) { // salt is ArrayBuffer
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: PK_ENC_AES_ALGORITHM, length: PK_ENC_AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPrivateKeyWithPassphrase(privateKeyPkcs8Buffer, passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_LENGTH_BYTES));
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(PK_ENC_AES_IV_LENGTH_BYTES));

  // Encrypt the PKCS8 private key buffer
  const encryptedPkResult = await window.crypto.subtle.encrypt(
    { name: PK_ENC_AES_ALGORITHM, iv: iv, tagLength: 128 },
    derivedKey,
    privateKeyPkcs8Buffer
  );
  // Separate ciphertext and tag
  const ciphertext = encryptedPkResult.slice(0, encryptedPkResult.byteLength - 16);
  const authTag = encryptedPkResult.slice(encryptedPkResult.byteLength - 16);

  return {
    encryptedPrivateKey_b64: arrayBufferToBase64(ciphertext),
    salt_b64: arrayBufferToBase64(salt),
    iv_b64: arrayBufferToBase64(iv),
    authTag_b64: arrayBufferToBase64(authTag),
  };
}

export async function decryptPrivateKeyWithPassphrase(encryptedPrivateKey_b64, salt_b64, iv_b64, authTag_b64, passphrase) {
  const salt = base64ToArrayBuffer(salt_b64);
  const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
  const iv = base64ToArrayBuffer(iv_b64);
  const authTag = base64ToArrayBuffer(authTag_b64);
  const encryptedPkBuffer = base64ToArrayBuffer(encryptedPrivateKey_b64);

  // Combine ciphertext and authTag for decryption
  const fullEncryptedBuffer = new Uint8Array(encryptedPkBuffer.byteLength + authTag.byteLength);
  fullEncryptedBuffer.set(new Uint8Array(encryptedPkBuffer), 0);
  fullEncryptedBuffer.set(new Uint8Array(authTag), encryptedPkBuffer.byteLength);

  const decryptedPkcs8Buffer = await window.crypto.subtle.decrypt(
    { name: PK_ENC_AES_ALGORITHM, iv: iv, tagLength: 128 },
    derivedKey,
    fullEncryptedBuffer.buffer
  );
  return decryptedPkcs8Buffer; // This is the PKCS8 ArrayBuffer
}