import React from 'react';
import '../styles/Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Logo / site title */}
        <div className="header-logo">
          HealthBridge
        </div>

        {/* Optional nav or actions */}
        <nav className="header-nav">
          <button className="header-action">
            Read Blogs
          </button>
        </nav>
      </div>
    </header>
  );
}
