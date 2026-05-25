'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_CONFIG } from './constants';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('delivery_app_access_token') : null;
      if (token !== currentToken) {
        setCurrentToken(token);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 500);

    window.addEventListener('storage', checkToken);
    window.addEventListener('auth_change', checkToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('auth_change', checkToken);
    };
  }, [currentToken]);

  useEffect(() => {
    const socketUrl = WS_CONFIG.BASE_URL;

    // Сначала гасим старый сокет, если он был
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // БЛОКИРОВКА АНОНИМНОГО РЕЖИМА: Без токена соединение не создаем
    if (!currentToken) {
      console.log('[Socket] Доступ ограничен: подключение ожидается после входа');
      setSocket(null);
      return; 
    }

    console.log('[Socket] Создание авторизованного подключения...');

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'], 
      forceNew: true, 
      multiplex: false, 
      auth: { token: currentToken },
      query: { token: currentToken }
    });

    socketInstance.on('connect', () => {
      console.log('✅ [Socket] Успешно подключено к бэкенду! ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ [Socket] Соединение разорвано');
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
    };
  }, [currentToken]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
