import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';
import '../styles/Auth.css';

function LoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login response:", response);
      console.log("Login data:", data); 
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data._id);
      localStorage.setItem('email', data.email);
      // localStorage.setItem('keySalt' , data.keySalt);
      // localStorage.setItem('encryptedPrivateKey', data.encryptedPrivateKey);
      onLoginSuccess();
      navigate('/myfiles'); // Redirect to home page after successful login
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
        <h2>Welcome Back</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="auth-button">Sign In</button>
        </form>
        <p className="auth-link">
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage; 