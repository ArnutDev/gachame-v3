import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';
import RangerGacha from './pages/RangerGacha';
import GearGacha from './pages/GearGacha';
import Collection from './pages/Collection';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

const Layout = () => {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/ranger-gacha">Ranger Gacha</NavLink>
        <NavLink to="/gear-gacha">Gear Gacha</NavLink>
        <NavLink to="/collection">Collection</NavLink>
        <NavLink to="/statistics">Statistics</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ranger-gacha" element={<RangerGacha />} />
          <Route path="gear-gacha" element={<GearGacha />} />
          <Route path="collection" element={<Collection />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
