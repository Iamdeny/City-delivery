import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text = 'Загрузка...',
}) => {
  const sizeClass = `spinner--${size}`;

  return (
    <div className='loading-container'>
      <div className={`spinner ${sizeClass}`}>
        <div className='spinner-inner'></div>
      </div>
      {text && <p className='loading-text'>{text}</p>}
    </div>
  );
};
