// admin/src/pages/App.jsx
import React from 'react';
import { BrowserRouter, Link, Routes, Route, useLocation } from 'react-router-dom';
import AppRouter from './router';

const nav = [
  { path: '/', label: 'Главная' },
  { path: '/analytics', label: 'Аналитика рекомендаций' },
];

function Layout({ children }) {
  const location = useLocation();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#1a1a1a',
        color: '#fff',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '18px' }}>City Delivery — Админ</span>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {nav.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                color: location.pathname === path ? '#fff' : 'rgba(255,255,255,0.8)',
                background: location.pathname === path ? 'rgba(255,255,255,0.15)' : 'transparent',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '24px' }}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Layout>
          <AppRouter />
        </Layout>
      </div>
    </BrowserRouter>
  );
}

export default App;
