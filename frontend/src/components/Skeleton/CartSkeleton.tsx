import React from 'react';
import './Skeleton.css';

export const CartSkeleton: React.FC = () => {
  return (
    <div className='cart-skeleton'>
      <div className='skeleton-header'>
        <div className='skeleton-line skeleton-line--header'></div>
        <div className='skeleton-button skeleton-button--small'></div>
      </div>

      <div className='cart-items-skeleton'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='cart-item-skeleton'>
            <div className='skeleton-circle'></div>
            <div className='skeleton-content'>
              <div className='skeleton-line'></div>
              <div className='skeleton-line skeleton-line--short'></div>
              <div className='skeleton-controls'>
                <div className='skeleton-circle skeleton-circle--small'></div>
                <div className='skeleton-line skeleton-line--quantity'></div>
                <div className='skeleton-circle skeleton-circle--small'></div>
              </div>
            </div>
            <div className='skeleton-right'>
              <div className='skeleton-line skeleton-line--price'></div>
              <div className='skeleton-circle skeleton-circle--remove'></div>
            </div>
          </div>
        ))}
      </div>

      <div className='cart-summary-skeleton'>
        <div className='skeleton-summary-row'></div>
        <div className='skeleton-summary-row'></div>
        <div className='skeleton-total'></div>
        <div className='skeleton-button skeleton-button--large'></div>
      </div>
    </div>
  );
};
