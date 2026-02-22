// src/config/tracking.js
module.exports = {
  // Радиусы геозон (метры)
  GEOFENCE_ZONES: {
    APPROACHING_STORE: 500,
    AT_STORE: 100,
    APPROACHING_CLIENT: 500,
    AT_CLIENT: 100,
    DEPARTED_STORE: 200,
  },

  // Средняя скорость для разных типов транспорта (метров в минуту)
  AVERAGE_SPEED: {
    foot: 80, // пешком ~5 км/ч
    bike: 200, // велосипед ~12 км/ч
    car: 400, // автомобиль ~24 км/ч (в городе)
    default: 100, // по умолчанию
  },

  // Интервалы обновления ETA (секунды)
  ETA_UPDATE_INTERVALS: {
    FAST: 10,
    NORMAL: 30,
    SLOW: 60,
  },

  // Минимальная точность GPS для обработки (метры)
  MIN_ACCURACY: 100,

  // Время жизни кэша позиции в Redis (секунды)
  COURIER_POSITION_TTL: 60 * 5, // 5 минут

  // Время жизни блокировок геозон (секунды)
  GEOFENCE_LOCK_TTL: 10,
};
