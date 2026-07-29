import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import Home from './pages/Home';
import RangerGacha from './pages/RangerGacha';
import GearGacha from './pages/GearGacha';
import About from './pages/About';
import DevTesting from './pages/DevTesting';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ranger-gacha" element={<RangerGacha />} />
          <Route path="gear-gacha" element={<GearGacha />} />
          <Route path="about" element={<About />} />
          <Route path="dev" element={<DevTesting />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
