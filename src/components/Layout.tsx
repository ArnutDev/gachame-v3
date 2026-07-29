import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { GachaProvider } from '../context/GachaContext';

export default function Layout() {
  return (
    <GachaProvider>
      <div className="app-layout">
        <Header />
        <main className="app-main-content">
          <div className="main-container">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </GachaProvider>
  );
}
