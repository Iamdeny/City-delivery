/**
 * Заголовок секции
 * Согласно ТЗ: h2, полужирный, 20-24px, отступ слева 16px
 */
'use client';

interface SectionHeaderProps {
  title: string;
  className?: string;
}

export function SectionHeader({ title, className = '' }: SectionHeaderProps) {
  return (
    <h2 className={`text-[22px] font-semibold text-gray-900 pl-4 mb-3 mt-0 ${className}`}>
      {title}
    </h2>
  );
}
