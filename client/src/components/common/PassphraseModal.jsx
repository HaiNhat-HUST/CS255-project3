// src/components/common/PassphraseModal.js
import React, { useState } from 'react';

const PassphraseModal = ({ isOpen, onClose, onSubmit, title = "Enter Key Passphrase", message }) => {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passphrase) {
      setError('Passphrase cannot be empty.');
      return;
    }
    onSubmit(passphrase);
    // Optionally clear passphrase and error after submission, or let parent handle modal close
    // setPassphrase('');
    // setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay}>
      <div className="modal-content" style={styles.content}>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="passphrase">Key Passphrase:</label>
            <input
              type="password"
              id="passphrase"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setError(''); }}
              style={styles.input}
              autoFocus
            />
          </div>
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary}>Submit</button>
            <button type="button" onClick={() => { setPassphrase(''); setError(''); onClose(); }} style={styles.buttonSecondary}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Basic inline styles for demonstration
const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  content: { background: 'white', padding: '20px 30px', borderRadius: '8px', minWidth: '350px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
  buttonGroup: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  buttonPrimary: { padding: '8px 15px', backgroundColor: '#673ab7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  buttonSecondary: { padding: '8px 15px', backgroundColor: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
};

export default PassphraseModal;