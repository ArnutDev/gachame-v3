import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main-content">
        <div className="main-container">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
