import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'City Delivery',
    short_name: 'CityDelivery',
    description: 'Современная доставка',
    start_url: '/',
    scope: '/',
    // Best effort fullscreen:
    // - Android/Chrome: display_override prefers fullscreen where supported
    // - iOS: uses appleWebApp meta (see app/layout.tsx)
    display: 'standalone',
    display_override: ['fullscreen', 'standalone'],
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'any',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}

