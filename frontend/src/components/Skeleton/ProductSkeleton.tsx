import React from 'react';
import './Skeleton.css';

interface ProductSkeletonProps {
  count?: number;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  count = 8,
}) => {
  return (
    <div className='products-grid'>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className='product-card skeleton-card'>
          <div className='skeleton-image'></div>
          <div className='skeleton-content'>
            <div className='skeleton-line skeleton-line--title'></div>
            <div className='skeleton-line skeleton-line--category'></div>
            <div className='skeleton-footer'>
              <div className='skeleton-line skeleton-line--price'></div>
              <div className='skeleton-button'></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
