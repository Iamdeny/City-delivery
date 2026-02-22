/**
 * Categories Section - Client Component для анимаций
 */
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface Category {
  name: string;
  link: string;
}

interface CategoriesSectionProps {
  categories: Category[];
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Популярные категории
          </h2>
          <p className="text-lg text-gray-600">
            Выберите категорию и начните покупки
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => {
            const icon = getCategoryIcon(category.name);
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Link
                  href={category.link}
                  className="block p-6 bg-gradient-to-br rounded-2xl shadow-md hover:shadow-xl transition-all text-center group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {category.name}
                  </h3>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
