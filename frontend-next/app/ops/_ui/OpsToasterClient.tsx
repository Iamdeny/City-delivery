'use client';

import { Toaster } from 'sonner';

export function OpsToasterClient() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3500}
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl border border-gray-200 bg-white shadow-xl',
          title: 'text-sm font-extrabold text-gray-900',
          description: 'text-sm text-gray-700',
        },
      }}
    />
  );
}

