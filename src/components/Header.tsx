import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Navigation from './Navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-container">
        <NavLink to="/" className="header-logo" onClick={() => setIsMenuOpen(false)}>
          <span className="logo-icon">🎯</span>
          <span className="logo-text">
            Gacha<span className="logo-highlight">Me</span>
          </span>
        </NavLink>

        <button
          className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        <div className={`nav-wrapper ${isMenuOpen ? 'mobile-open' : ''}`}>
          <Navigation closeMenu={() => setIsMenuOpen(false)} />
        </div>
      </div>
    </header>
  );
}
