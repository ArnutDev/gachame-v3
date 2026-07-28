import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} GachaMe. All rights reserved.
        </p>
        <p className="footer-meta">
          LINE Rangers Gacha Simulator • Built dynamically from game configuration
        </p>
      </div>
    </footer>
  );
}
