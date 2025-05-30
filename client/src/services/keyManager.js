// src/services/keyManager.js (Illustrative - integrate with your state management)
import * as cryptoUtils from '../utils/cryptoUtils';
import api from './api'; // Your configured axios instance

const PK_STORAGE_KEY = 'userEncryptedPK';

// --- Store for current session keys ---
let sessionUserPublicKey = null; // CryptoKey object
let sessionUserPrivateKey = null; // CryptoKey object

export async function setupUserKeysAndStore(passphrase, username, email, passwordForRegistration) {
  try {
    const keyPair = await cryptoUtils.generateRSAKeyPair();
    const publicKeyPEM = await cryptoUtils.exportPublicKeyAsPEM(keyPair.publicKey);
    const privateKeyPKCS8Buffer = await cryptoUtils.exportPrivateKeyAsPKCS8(keyPair.privateKey);

    // 1. Register user first (if not already done)
    // This part depends on your auth flow. Assuming registration is separate or happens before.
    // For this example, let's assume the user is already registered and we just store the public key.
    // If registration and key setup are combined:
    // const regResponse = await api.post('/auth/register', { username, email, password: passwordForRegistration, userPublicKey: publicKeyPEM });
    // if (!regResponse.data.token) throw new Error("Registration failed during key setup");

    // 2. Store Public Key on Server (assuming user is logged in)
    await api.put('/auth/me/public-key', { publicKey: publicKeyPEM });
    console.log('Public key stored on server.');

    // 3. Encrypt and Store Private Key Locally
    const {
      encryptedPrivateKey_b64,
      salt_b64,
      iv_b64,
      authTag_b64,
    } = await cryptoUtils.encryptPrivateKeyWithPassphrase(privateKeyPKCS8Buffer, passphrase);

    localStorage.setItem(PK_STORAGE_KEY, JSON.stringify({
      epk: encryptedPrivateKey_b64,
      s: salt_b64,
      i: iv_b64,
      t: authTag_b64,
    }));
    console.log('Encrypted private key stored locally.');

    // Set session keys
    sessionUserPublicKey = keyPair.publicKey;
    sessionUserPrivateKey = keyPair.privateKey; // Be mindful of keeping this in memory

    return { success: true, publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
  } catch (error) {
    console.error('Error setting up user keys:', error);
    return { success: false, error };
  }
}

export function hasLocalPrivateKey() {
    return !!localStorage.getItem(PK_STORAGE_KEY);
}

export async function loadAndDecryptPrivateKeyFromStorage(passphrase) {
  if (sessionUserPrivateKey) return sessionUserPrivateKey; // Already in memory

  const storedData = localStorage.getItem(PK_STORAGE_KEY);
  if (!storedData) {
    throw new Error('No encrypted private key found in local storage.');
  }
  const { epk, s, i, t } = JSON.parse(storedData);
  if (!epk || !s || !i || !t) {
    throw new Error('Stored private key data is corrupted or incomplete.');
  }

  try {
    const decryptedPkcs8Buffer = await cryptoUtils.decryptPrivateKeyWithPassphrase(epk, s, i, t, passphrase);
    sessionUserPrivateKey = await cryptoUtils.importPrivateKeyFromPKCS8(decryptedPkcs8Buffer);
    // Also load public key if needed for the session
    if (!sessionUserPublicKey) {
        // Fetch from server or re-derive (if possible, but SPKI is better from server)
        const user = JSON.parse(localStorage.getItem('userInfo')); // Assuming user info with token is stored
        if (user && user.userPublicKey) { // Assuming public key is stored with user info after login/update
            sessionUserPublicKey = await cryptoUtils.importPublicKeyFromPEM(user.userPublicKey);
        } else {
            // Fallback: try to fetch user's own public key from server
            // This needs the user to be authenticated.
            // const profileRes = await api.get('/auth/me');
            // if (profileRes.data && profileRes.data.userPublicKey) {
            //     sessionUserPublicKey = await cryptoUtils.importPublicKeyFromPEM(profileRes.data.userPublicKey);
            // } else {
            //    console.warn("Could not load public key for session automatically.");
            // }
        }
    }
    return sessionUserPrivateKey;
  } catch (error) {
    console.error('Failed to decrypt private key:', error);
    sessionUserPrivateKey = null; // Clear on failure
    throw error; // Re-throw for UI to handle
  }
}

export async function getUserPublicKey(forceRefresh = false) {
    if (sessionUserPublicKey && !forceRefresh) return sessionUserPublicKey;
    // Fetch user's own public key from server
    // This assumes the user is logged in.
    try {
        const response = await api.get('/auth/me'); // Endpoint that returns current user's profile including publicKey
        if (response.data && response.data.userPublicKey) {
            sessionUserPublicKey = await cryptoUtils.importPublicKeyFromPEM(response.data.userPublicKey);
            return sessionUserPublicKey;
        }
        throw new Error("User public key not found on server profile.");
    } catch (error) {
        console.error("Failed to get user public key:", error);
        throw error;
    }
}

export function clearSessionKeys() {
    sessionUserPrivateKey = null;
    sessionUserPublicKey = null;
    // Optionally clear other sensitive session data
}

// For sharing:
export async function fetchUserPublicKeyFromServer(userId) {
    try {
        const response = await api.get(`/auth/users/${userId}/public-key`);
        if (response.data && response.data.userPublicKey) {
            return cryptoUtils.importPublicKeyFromPEM(response.data.userPublicKey);
        }
        throw new Error("Public key not found for user " + userId);
    } catch (error) {
        console.error(`Failed to fetch public key for user ${userId}:`, error);
        throw error;
    }
}