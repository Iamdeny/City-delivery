/**
 * Заголовок страницы категорий
 * Согласно ТЗ: крупный текст "Categories" по центру
 */
'use client';

export function CategoriesHeader() {
  return (
    <div className="flex justify-center items-center pt-5 pb-4">
      <h1 className="text-[30px] font-bold text-gray-900 text-center m-0">
        Categories
      </h1>
    </div>
  );
}
