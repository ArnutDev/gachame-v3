import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavigationProps {
  closeMenu?: () => void;
}

export default function Navigation({ closeMenu }: NavigationProps) {
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/ranger-gacha', label: 'Ranger Gacha' },
    { path: '/gear-gacha', label: 'Gear Gacha' },
    { path: '/updates', label: 'Updates' },
    { path: '/about', label: 'About' },
  ];

  return (
    <nav className="app-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={closeMenu}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
