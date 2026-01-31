/**
 * Карточка категории для секции "Standard Products"
 * Согласно ТЗ: заголовок (bold, 18px), описание (regular, 14px, серый)
 */
'use client';

interface CategoryCardProps {
  title: string;
  description?: string;
  count?: number;
  onClick?: () => void;
  className?: string;
}

export function CategoryCard({ title, description, count, onClick, className = '' }: CategoryCardProps) {
  const subtitle = description ?? (typeof count === 'number' ? `${count} товаров` : '');
  return (
    <div 
      className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <h3 className="text-lg font-bold text-gray-900 m-0 mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-600 m-0 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
