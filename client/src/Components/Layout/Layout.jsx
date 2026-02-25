import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

const Layout = () => {
  const { isAuthenticated, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // Show sidebar only on certain routes
  const showSidebar = isAuthenticated && 
  (
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/domain') ||
    location.pathname.startsWith('/exam') ||
    location.pathname.startsWith('/problems') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/recruiter')
  );

  return (
    <div className="layout">
      <Navbar />
      <div className="layout-content">
        {showSidebar && <Sidebar />}
        <main className={`main-content ${showSidebar ? 'with-sidebar' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;