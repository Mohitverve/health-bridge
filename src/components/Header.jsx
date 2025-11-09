import React from 'react';
import '../styles/Header.css';
import { useNavigate } from 'react-router-dom';


export default function Header() {
   const navigate = useNavigate();
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Logo / site title */}
        <div className="header-logo">
          Medway Horizons
        </div>

        {/* Optional nav or actions */}
        <nav className="header-nav">
          <button className="header-action"   onClick={() => navigate('/Blogs')}>
            Read Blogs
          </button>
        </nav>
      </div>
    </header>
  );
}
