import React from 'react';
import './Skeleton.css';

export const HeaderSkeleton: React.FC = () => {
  return (
    <header className='header-skeleton'>
      <div className='skeleton-logo'></div>
      <div className='skeleton-controls-row'>
        <div className='skeleton-icon-button'></div>
        <div className='skeleton-cart-summary'></div>
      </div>
    </header>
  );
};
