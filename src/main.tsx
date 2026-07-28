import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import Home from './pages/Home';
import RangerGacha from './pages/RangerGacha';
import GearGacha from './pages/GearGacha';
import Collection from './pages/Collection';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

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
