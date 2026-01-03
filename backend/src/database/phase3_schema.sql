-- ============================================
-- PHASE 3: REAL-TIME & NOTIFICATIONS SCHEMA
-- Дата: 3 января 2026
-- ============================================

-- 1. Добавить FCM token для push уведомлений
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMP;

-- Индекс для быстрого поиска по token
CREATE INDEX IF NOT EXISTS idx_users_fcm_token 
  ON users(fcm_token) 
  WHERE fcm_token IS NOT NULL;

-- 2. Создать таблицу для истории перемещений курьера (tracking)
CREATE TABLE IF NOT EXISTS courier_location_history (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- GPS accuracy в метрах
  speed DECIMAL(6, 2),    -- Скорость в м/с
  bearing DECIMAL(5, 2),  -- Направление (0-360 градусов)
  altitude DECIMAL(7, 2), -- Высота над уровнем моря
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска истории
CREATE INDEX IF NOT EXISTS idx_courier_history_courier 
  ON courier_location_history(courier_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_history_order 
  ON courier_location_history(order_id, recorded_at DESC);

-- Партиционирование по времени (опционально для больших объемов)
-- CREATE INDEX IF NOT EXISTS idx_courier_history_time 
--   ON courier_location_history(recorded_at DESC);

-- 3. Добавить поля для ETA в заказы (уже есть estimated_delivery_time)
-- Добавляем поля для ML-модели ETA
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS eta_base_minutes INTEGER,           -- Базовый ETA (расстояние/скорость)
  ADD COLUMN IF NOT EXISTS eta_traffic_factor DECIMAL(3, 2),  -- Фактор трафика (1.0 = норма, 1.5 = +50%)
  ADD COLUMN IF NOT EXISTS eta_updated_at TIMESTAMP,          -- Последнее обновление ETA
  ADD COLUMN IF NOT EXISTS eta_confidence DECIMAL(3, 2);      -- Уверенность прогноза (0-1)

-- 4. Таблица для хранения историических данных ETA (для ML-модели)
CREATE TABLE IF NOT EXISTS eta_predictions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  predicted_minutes INTEGER NOT NULL,
  actual_minutes INTEGER,                  -- Заполняется после доставки
  distance_meters DECIMAL(10, 2),
  time_of_day TIME,
  day_of_week INTEGER,                     -- 1-7 (Mon-Sun)
  weather_condition VARCHAR(50),           -- 'clear', 'rain', 'snow'
  traffic_level VARCHAR(20),               -- 'low', 'medium', 'high'
  prediction_accuracy DECIMAL(5, 2),       -- Точность после доставки (%)
  predicted_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

-- Индексы для ML-анализа
CREATE INDEX IF NOT EXISTS idx_eta_predictions_order 
  ON eta_predictions(order_id);

CREATE INDEX IF NOT EXISTS idx_eta_predictions_analysis 
  ON eta_predictions(time_of_day, day_of_week, delivered_at) 
  WHERE delivered_at IS NOT NULL;

-- 5. Таблица для геозон (geofences)
CREATE TABLE IF NOT EXISTS geofences (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  courier_id INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  zone_type VARCHAR(50) NOT NULL,         -- 'approaching_store', 'at_store', 'approaching_client', 'at_client'
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  latitude DECIMAL(10, 8),                -- Где сработала геозона
  longitude DECIMAL(11, 8),
  distance_meters DECIMAL(10, 2),         -- Расстояние до цели в момент срабатывания
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для отслеживания геозон
CREATE INDEX IF NOT EXISTS idx_geofences_order 
  ON geofences(order_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_geofences_courier 
  ON geofences(courier_id, triggered_at DESC);

-- 6. Расширение таблицы notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS fcm_message_id TEXT,      -- ID сообщения в FCM
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,        -- Время отправки
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,   -- Время доставки (от FCM)
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP,     -- Время клика пользователем
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'sent', 'delivered', 'clicked', 'failed'

-- Индекс для статистики по уведомлениям
CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON notifications(status, sent_at DESC);

-- 7. Таблица для A/B тестирования уведомлений
CREATE TABLE IF NOT EXISTS notification_experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  variant_a_template JSONB NOT NULL,
  variant_b_template JSONB NOT NULL,
  variant_a_sent INTEGER DEFAULT 0,
  variant_b_sent INTEGER DEFAULT 0,
  variant_a_clicked INTEGER DEFAULT 0,
  variant_b_clicked INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- 8. Функции и триггеры

-- Функция для автоматического обновления fcm_token_updated_at
CREATE OR REPLACE FUNCTION update_fcm_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fcm_token IS DISTINCT FROM OLD.fcm_token THEN
    NEW.fcm_token_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fcm_token_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_token_timestamp();

-- Функция для очистки старой истории перемещений (> 30 дней)
CREATE OR REPLACE FUNCTION cleanup_old_courier_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM courier_location_history
  WHERE recorded_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии для документации
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging token для push уведомлений';
COMMENT ON TABLE courier_location_history IS 'История перемещений курьера для аналитики и replay';
COMMENT ON TABLE eta_predictions IS 'Данные для ML-модели прогнозирования времени доставки';
COMMENT ON TABLE geofences IS 'История срабатывания геозон для уведомлений';
COMMENT ON TABLE notification_experiments IS 'A/B тестирование эффективности уведомлений';

-- Примеры использования:

-- 1. Сохранить FCM token
-- UPDATE users SET fcm_token = 'device_token_here' WHERE id = 1;

-- 2. Сохранить позицию курьера
-- INSERT INTO courier_location_history (courier_id, order_id, latitude, longitude, accuracy, speed)
-- VALUES (1, 123, 55.7558, 37.6173, 10.5, 1.5);

-- 3. Сохранить ETA prediction
-- INSERT INTO eta_predictions (order_id, predicted_minutes, distance_meters, time_of_day, day_of_week)
-- VALUES (123, 25, 3500, '14:30:00', 5);

-- 4. Сохранить срабатывание геозоны
-- INSERT INTO geofences (order_id, courier_id, zone_type, latitude, longitude, distance_meters, notification_sent)
-- VALUES (123, 1, 'approaching_client', 55.7558, 37.6173, 450, true);

-- 5. Очистка старой истории (запускать по cron каждую неделю)
-- SELECT cleanup_old_courier_history();

-- ============================================
-- CART ITEMS TABLE (для Smart Cart)
-- ============================================

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  dark_store_id INTEGER REFERENCES dark_stores(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2),                  -- Цена на момент добавления в корзину
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id, dark_store_id) -- Один товар от одного склада не дублируется
);

-- Индексы для быстрого доступа к корзине
CREATE INDEX IF NOT EXISTS idx_cart_items_user 
  ON cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_product 
  ON cart_items(product_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Функция для очистки старых корзин (> 7 дней неактивности)
CREATE OR REPLACE FUNCTION cleanup_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items
  WHERE updated_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE cart_items IS 'Корзина покупок пользователя';
COMMENT ON FUNCTION cleanup_abandoned_carts() IS 'Очистка брошенных корзин старше 7 дней';

