/**
 * Конфигурация зоны доставки
 */

module.exports = {
  // Максимальное расстояние от склада для доставки (в км)
  // Если клиент дальше - заказ отклоняется
  MAX_DELIVERY_DISTANCE_KM: process.env.MAX_DELIVERY_DISTANCE_KM 
    ? parseFloat(process.env.MAX_DELIVERY_DISTANCE_KM) 
    : 50, // По умолчанию 50 км

  // Радиус доставки склада (в метрах) - используется из БД, но можно переопределить
  DEFAULT_DELIVERY_RADIUS_M: 5000, // 5 км
};

