/**
 * Empty State для корзины
 * Показывается когда корзина пуста
 * Включает кнопку "Перейти к покупкам" и блок "Вы недавно смотрели"
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../entities/cart/model/store';
import type { CartItem } from '../../entities/cart/model/schema';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import { getIconSize } from '../../shared/constants/icon-sizes';
import './CartEmptyState.css';

interface CartEmptyStateProps {
  onGoToShopping?: () => void;
  onAddItem?: (productId: number) => void;
}

export function CartEmptyState({ 
  onGoToShopping,
  onAddItem 
}: CartEmptyStateProps) {
  const { recentlyRemoved, addItem } = useCartStore();

  const handleAddFromRecent = (item: CartItem) => {
    // Создаем Product из CartItem для добавления
    const product = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      inStock: item.inStock,
    };
    addItem(product);
    onAddItem?.(item.id);
  };

  return (
    <motion.div
      className="cart-empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cart-empty-content">
        {/* Иконка */}
        <motion.div
          className="cart-empty-icon"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <ShoppingBag size={getIconSize('2xl')} strokeWidth={1.5} />
        </motion.div>

        {/* Текст */}
        <h2 className="cart-empty-title">Корзина пуста</h2>
        <p className="cart-empty-description">
          Добавьте товары из каталога, чтобы начать покупки
        </p>

        {/* Кнопка "Перейти к покупкам" */}
        <motion.button
          className="cart-empty-button"
          onClick={onGoToShopping}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Перейти к покупкам"
        >
          <span>Перейти к покупкам</span>
          <ArrowRight size={getIconSize('md')} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Блок "Вы недавно смотрели" */}
      {recentlyRemoved.length > 0 && (
        <motion.div
          className="cart-recently-viewed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h3 className="recently-viewed-title">Вы недавно смотрели</h3>
          <div className="recently-viewed-grid">
            {recentlyRemoved.map((item, index) => (
              <motion.div
                key={item.id}
                className="recently-viewed-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleAddFromRecent(item)}
              >
                {item.image && (
                  <div className="recently-viewed-image">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="recently-viewed-info">
                  <p className="recently-viewed-name">{item.name}</p>
                  <p className="recently-viewed-price">
                    <PriceDisplay price={item.price} size="sm" />
                  </p>
                </div>
                <motion.button
                  className="recently-viewed-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFromRecent(item);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Добавить ${item.name} в корзину`}
                >
                  <ArrowRight size={getIconSize('sm')} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
