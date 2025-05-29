import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaRegFileAlt, FaShareAlt, FaKey, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import '../../index.css';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/my-files', label: 'My Files', icon: <FaRegFileAlt /> },
    { path: '/shared-with-me', label: 'Shared With Me', icon: <FaShareAlt /> },
    { path: '/token-management', label: 'Token Management', icon: <FaKey /> },
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
              key={item.path}
              className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <Link to={item.path}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
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
