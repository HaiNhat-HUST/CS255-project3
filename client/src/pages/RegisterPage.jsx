import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';
import '../styles/Auth.css';
import { generateUserKeyPair, encryptPrivateKeyWithPassphrase } from '../utils/keyUtils';
function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    passphrase: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    //     if (!passwordRegex.test(form.password)) {
    //         setError('Password must contain uppercase, lowercase, digit, special char and be at least 8 characters');
    //         return;
    //     }
    if (!formData.passphrase || formData.passphrase.length < 6) {
      setError('Please provide a strong passphrase for securing your file')
    }
    try {
      const { publicKeyPem, privateKeyPem } = await generateUserKeyPair();
      const { encryptedPrivateKey, saltBase64 } = await encryptPrivateKeyWithPassphrase(privateKeyPem, formData.passphrase);


      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          userPublicKey: publicKeyPem,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.message || data.error || 'Server error during registration');
      }

      // Store the key  in localStorage
      localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
      localStorage.setItem('keySalt', saltBase64);

      // const blob = new Blob([privateKeyPem], { type: 'text/plain' });
      // const a = document.createElement('a');
      // a.href = URL.createObjectURL(blob);
      // a.download = 'private_key.pem';
      // a.click();

      navigate('/'); // Redirect to home page after successful registration
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <FaShieldAlt />
        </div>
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">User Name</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your user name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="passphrase">Passphrase</label>
            <input
              type="password"
              id="passphrase"
              name="passphrase"
              value={formData.passphrase}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>
          <button type="submit" className="auth-button">Create Account</button>
        </form>
        <p className="auth-link">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Sign in here</span>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage; 