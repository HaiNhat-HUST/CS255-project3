import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import UserAvatar from './components/layout/UserAvatar';
import MyFilesPage from './pages/MyFilesPage';
import SharedWithMePage from './pages/SharedWithMePage';
import TokenManagementPage from './pages/TokenManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content-area">
          <UserAvatar initials="DB" />
          <Routes>
            <Route path="/my-files" element={<MyFilesPage />} />
            <Route path="/shared-with-me" element={<SharedWithMePage />} />
            <Route path="/token-management" element={<TokenManagementPage />} />
            <Route path="*" element={<Navigate to="/my-files" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
