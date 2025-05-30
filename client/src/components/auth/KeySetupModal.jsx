// src/components/auth/KeySetupModal.js
import React, { useState } from 'react';
import * as keyManager from '../../services/keyManager';
import { useAuth } from '../../contexts/AuthContext'; // To update auth context if needed

const KeySetupModal = ({ isOpen, onClose }) => {
  const { updateUserProfile } = useAuth(); // If public key is part of userInfo
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passphrase) {
      setError('Passphrase is required.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match.');
      return;
    }
    if (passphrase.length < 8) { // Enforce min length
        setError('Passphrase must be at least 8 characters long.');
        return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Passphrase is used to encrypt the generated private key
      const result = await keyManager.setupUserKeysAndStore(passphrase);
      if (result.success) {
        setSuccess('Security keys generated and stored successfully! Your public key has been saved to the server.');
        // Optionally update AuthContext if userPublicKey is stored there
        if (result.publicKey) { // setupUserKeysAndStore should return the public key object or PEM
            const pem = await keyManager.cryptoUtils.exportPublicKeyAsPEM(result.publicKey);
            updateUserProfile({ userPublicKey: pem });
        }
        // Consider auto-closing after a delay or requiring user to click "Done"
        // onClose(); // Or a "Done" button
      } else {
        throw result.error || new Error('Failed to set up keys.');
      }
    } catch (err) {
      console.error('Key setup failed:', err);
      setError(err.message || 'An error occurred during key setup.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay}> {/* Use styles from PassphraseModal or global modal styles */}
      <div className="modal-content" style={styles.content}>
        <h2>Setup Your Security Keys</h2>
        <p>This passphrase will encrypt your private key. It is critical and CANNOT be recovered if lost. Choose a strong, unique passphrase.</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        {!success && ( // Hide form after success, or provide a "Done" button
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="setup-passphrase">Key Passphrase:</label>
              <input type="password" id="setup-passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} style={styles.input} disabled={isLoading} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="confirm-passphrase">Confirm Passphrase:</label>
              <input type="password" id="confirm-passphrase" value={confirmPassphrase} onChange={(e) => setConfirmPassphrase(e.target.value)} style={styles.input} disabled={isLoading} />
            </div>
            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.buttonPrimary} disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Generate & Save Keys'}
              </button>
              <button type="button" onClick={onClose} style={styles.buttonSecondary} disabled={isLoading}>Cancel</button>
            </div>
          </form>
        )}
        {success && (
             <div style={styles.buttonGroup}>
                <button type="button" onClick={onClose} style={styles.buttonPrimary}>Done</button>
            </div>
        )}
      </div>
    </div>
  );
};
// Reuse styles from PassphraseModal or define centrally
const styles = { /* ... same as PassphraseModal styles ... */ };
export default KeySetupModal;