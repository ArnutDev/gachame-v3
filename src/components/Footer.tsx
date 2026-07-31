import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} GachaMe. All rights reserved.
        </p>
        <p className="footer-meta">
          LINE Rangers Gacha Simulator • Built dynamically from game
          configuration
        </p>
        <p className="footer-disclaimer mt-4 text-xs text-text-secondary/60 max-w-xl mx-auto leading-relaxed border-t border-border-color/30 pt-3">
          <strong>Disclaimer:</strong> GachaMe is a fan-made project created for
          learning and entertainment. It is not an official LINE Rangers
          website, and all game-related content belongs to its respective
          owners.
        </p>
      </div>
    </footer>
  );
}
