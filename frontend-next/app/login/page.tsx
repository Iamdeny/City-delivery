/**
 * Страница входа в систему
 */
'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import LoginForm from '@/app/components/auth/LoginForm';
import Breadcrumbs from '@/app/components/navigation/Breadcrumbs';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const next = sp.get('next');
    // Перенаправляем на next или страницу продуктов
    setTimeout(() => {
      router.push(next && next.startsWith('/') ? next : '/products');
    }, 1000);
  };

  const handleClose = () => {
    // Если пользователь закрыл форму, перенаправляем на главную
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-md">
        <div className="hidden lg:block mb-4">
          <Breadcrumbs />
        </div>
        <LoginForm
          onSuccess={handleLoginSuccess}
          onClose={handleClose}
          initialMode="login"
        />
      </div>
    </div>
  );
}
