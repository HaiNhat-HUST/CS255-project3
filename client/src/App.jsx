import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState('my-files');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'my-files':
        return <MyFilesPage />;
      case 'shared-with-me':
        return <SharedWithMePage />;
      case 'token-management':
        return <TokenManagementPage />;
      default:
        return <MyFilesPage />;
    }
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage  onLoginSuccess={() => setIsAuthenticated(true)}/>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path='/myfiles' element= {<MyFilesPage/>} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar activePage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
        <main className="main-content-area">
          <UserAvatar initials="DB" />
          {renderPage()}
        </main>
      </div>
    </Router>
  );
}

export default App;