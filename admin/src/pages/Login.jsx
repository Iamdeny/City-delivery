import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/login', {
        email,
        password,
      });

      const data = res.data || {};
      const user = data.user || {};

      if (!user.role || (user.role !== 'admin' && user.role !== 'manager')) {
        setError('Доступ в админ-панель разрешён только пользователям с ролью admin или manager.');
        return;
      }

      if (data.accessToken) {
        window.localStorage.setItem('cd_admin_access_token', data.accessToken);
      }
      if (data.refreshToken) {
        window.localStorage.setItem('cd_admin_refresh_token', data.refreshToken);
      }
      window.localStorage.setItem('cd_admin_user_role', user.role);
      window.localStorage.setItem('cd_admin_user_email', user.email || '');

      navigate('/analytics');
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Ошибка входа. Проверьте email и пароль.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0b1120',
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(15,23,42,0.7)',
          border: '1px solid rgba(148,163,184,0.35)',
          padding: '24px 24px 28px',
          color: '#e5e7eb',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              background:
                'linear-gradient(90deg, rgba(34,197,94,0.08), rgba(56,189,248,0.08))',
              border: '1px solid rgba(148,163,184,0.35)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#9ca3af',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '999px',
                background: '#22c55e',
                boxShadow: '0 0 0 4px rgba(34,197,94,0.35)',
              }}
            />
            <span>Admin • Secure Area</span>
          </div>
          <h1
            style={{
              fontSize: '22px',
              lineHeight: 1.2,
              fontWeight: 700,
              color: '#f9fafb',
              marginBottom: '4px',
            }}
          >
            Вход в админ-панель
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              margin: 0,
            }}
          >
            Используйте учётную запись администратора или менеджера, созданную через
            backend.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#9ca3af',
                marginBottom: '4px',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '10px 11px',
                borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.6)',
                background: '#020617',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 500,
                color: '#9ca3af',
                marginBottom: '4px',
              }}
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 11px',
                borderRadius: '10px',
                border: '1px solid rgba(148,163,184,0.6)',
                background: '#020617',
                color: '#e5e7eb',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#fecaca',
                background: 'rgba(248,113,113,0.08)',
                borderRadius: '8px',
                padding: '8px 10px',
                border: '1px solid rgba(248,113,113,0.4)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '10px 12px',
              borderRadius: '999px',
              border: 'none',
              background:
                'linear-gradient(135deg, #22c55e, #16a34a, #22c55e)',
              color: '#f9fafb',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>

        <p
          style={{
            marginTop: '18px',
            fontSize: '11px',
            color: '#6b7280',
            lineHeight: 1.4,
          }}
        >
          Токен хранится только в localStorage этого браузера и используется для
          запросов к `/api/admin/**`. При необходимости можете отозвать доступ,
          деактивировав пользователя на backend.
        </p>
      </div>
    </div>
  );
};

export default Login;

