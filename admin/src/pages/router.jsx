// admin/src/pages/router.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import Login from './Login';

const HomeStub = () => (
  <div style={{ maxWidth: '600px' }}>
    <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Главная</h1>
    <p style={{ color: '#555', marginBottom: '24px' }}>
      Добро пожаловать в админ-панель City Delivery. Используйте меню выше для перехода к разделам.
    </p>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <li style={{ marginBottom: '8px' }}>
        <Link to="/analytics" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
          → Аналитика рекомендаций
        </Link>
        {' — показы, клики и CTR по блоку «Советуем»'}
      </li>
    </ul>
  </div>
);

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeStub />} />
      <Route path="/login" element={<Login />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
      {/* Добавьте другие маршруты */}
      {/* <Route path="/products" element={<Products />} /> */}
      {/* <Route path="/orders" element={<Orders />} /> */}
    </Routes>
  );
};

export default AppRouter;
