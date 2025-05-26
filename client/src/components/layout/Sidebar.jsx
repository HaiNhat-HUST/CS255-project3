import React from 'react';
import { FaRegFileAlt, FaShareAlt, FaKey, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
// import logoImage from '../../assets/cryptafile-logo.png'; // If you have a logo
import '../../index.css';

const Sidebar = ({ activePage, onNavigate, onLogout }) => {
  const navItems = [
    { id: 'my-files', label: 'My Files', icon: <FaRegFileAlt /> },
    { id: 'shared-with-me', label: 'Shared With Me', icon: <FaShareAlt /> },
    { id: 'token-management', label: 'Token Management', icon: <FaKey /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <FaShieldAlt className="sidebar-logo-icon" />
        <h1 className="sidebar-title">CryptaFile</h1>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={onLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;