import React, { useEffect, useState } from 'react';

interface CartSyncNotificationProps {
  cartLength: number;
}

export const CartSyncNotification: React.FC<CartSyncNotificationProps> = ({
  cartLength,
}) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (cartLength > 0) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cartLength]);

  if (!showSaved) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#10b981',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 1000,
        animation: 'fadeInOut 2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      ✅ Корзина сохранена
    </div>
  );
};
