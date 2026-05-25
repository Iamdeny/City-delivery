import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShellClient } from './AppShellClient';
import { ViewportVars } from './system/ViewportVars';
import { SocketProvider } from '@/lib/socket'; // Импортируем наш провайдер сокетов

export const metadata: Metadata = {
  title: 'City Delivery',
  description: 'Современная доставка',
  applicationName: 'City Delivery',
  formatDetection: { telephone: false },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'City Delivery',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ru'>
      <body className="app-body flex flex-col">
        <ViewportVars />
        {/* Оборачиваем клиентскую часть приложения в сокет-провайдер */}
        <SocketProvider>
          <AppShellClient>{children}</AppShellClient>
        </SocketProvider>
      </body>
    </html>
  );
}
