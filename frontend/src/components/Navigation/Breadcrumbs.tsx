import React from 'react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
}) => {
  const allItems = showHome
    ? [
        { label: '🏠 Главная', onClick: () => (window.location.href = '/') },
        ...items,
      ]
    : items;

  return (
    <nav className='breadcrumbs' aria-label='Хлебные крошки'>
      <ol className='breadcrumbs-list'>
        {allItems.map((item, index) => (
          <li key={index} className='breadcrumbs-item'>
            {index < allItems.length - 1 ? (
              <>
                <button
                  onClick={item.onClick}
                  className={`breadcrumbs-link ${
                    item.isActive ? 'active' : ''
                  }`}
                  aria-label={`Перейти к ${item.label}`}
                  disabled={!item.onClick}
                >
                  {item.label}
                </button>
                <span className='breadcrumbs-separator'>›</span>
              </>
            ) : (
              <span
                className={`breadcrumbs-current ${
                  item.isActive ? 'active' : ''
                }`}
                aria-current='page'
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
