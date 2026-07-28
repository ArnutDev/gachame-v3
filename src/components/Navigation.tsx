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
    { path: '/collection', label: 'Collection' },
    { path: '/statistics', label: 'Statistics' },
    { path: '/settings', label: 'Settings' },
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
