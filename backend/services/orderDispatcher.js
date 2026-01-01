class OrderDispatcher {
  constructor() {
    this.availableCouriers = new Map();
    this.availablePickers = new Map();
  }

  // Найти ближайшего свободного курьера
  async findNearestCourier(darkStoreId, deliveryAddress) {
    const { lat, lng } = await this.geocodeAddress(deliveryAddress);

    // Ищем курьеров в радиусе 3 км от магазина
    const query = `
      SELECT c.*, 
        (6371 * acos(
          cos(radians($1)) * cos(radians(c.current_location_lat)) * 
          cos(radians(c.current_location_lng) - radians($2)) + 
          sin(radians($1)) * sin(radians(c.current_location_lat))
        )) AS distance
      FROM couriers c
      WHERE c.is_active = true 
        AND c.current_order_id IS NULL
        AND c.dark_store_id = $3
      HAVING distance < 3
      ORDER BY distance
      LIMIT 5
    `;

    const result = await db.query(query, [lat, lng, darkStoreId]);

    if (result.rows.length === 0) {
      // Если нет курьеров рядом, ищем любого свободного
      const fallback = await db.query(
        `
        SELECT * FROM couriers 
        WHERE is_active = true AND current_order_id IS NULL
        AND dark_store_id = $1
        LIMIT 1
      `,
        [darkStoreId]
      );

      return fallback.rows[0];
    }

    return result.rows[0];
  }

  // Рассчитать время доставки
  async calculateDeliveryTime(darkStoreId, address) {
    const store = await db.query(
      'SELECT latitude, longitude FROM dark_stores WHERE id = $1',
      [darkStoreId]
    );

    const destination = await this.geocodeAddress(address);

    // Рассчитываем расстояние (упрощенно)
    const distance = this.calculateDistance(
      store.rows[0].latitude,
      store.rows[0].longitude,
      destination.lat,
      destination.lng
    );

    // 5 минут на сборку + 2 минуты на км + 5 минут на поиск адреса
    const totalMinutes = Math.round(5 + distance * 2 + 5);

    return {
      distance: distance.toFixed(1),
      minutes: totalMinutes,
      maxMinutes: totalMinutes + 10,
    };
  }

  // Геокодирование адреса (упрощенное)
  async geocodeAddress(address) {
    // В реальности используйте Яндекс.Карты или Google Maps API
    // Для MVP возвращаем моковые координаты
    return {
      lat: 55.7558 + (Math.random() * 0.1 - 0.05),
      lng: 37.6173 + (Math.random() * 0.1 - 0.05),
    };
  }

  // Расчет расстояния по формуле гаверсинусов
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new OrderDispatcher();
