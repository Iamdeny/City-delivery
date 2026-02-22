/**
 * ContentWrapper — Premium 2026
 * Боковые отступы 16px (1rem), max-width 430px для iPhone Pro Max.
 * Межколонник (gutter) 12px через gap.
 */
'use client';

import { ReactNode } from 'react';

interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  /** gap между детьми (gutter 12px по умолчанию) */
  gap?: 'none' | 'gutter' | 'section';
}

export default function ContentWrapper({
  children,
  className = '',
  gap = 'gutter',
}: ContentWrapperProps) {
  const gapClass =
    gap === 'section' ? 'space-y-8' : gap === 'gutter' ? 'gap-3' : '';

  return (
    <div
      className={`max-w-[430px] mx-auto w-full ${gapClass} ${className}`}
      style={{
        paddingLeft: 'var(--premium-margin-mobile)',
        paddingRight: 'var(--premium-margin-mobile)',
      }}
    >
      {children}
    </div>
  );
}
