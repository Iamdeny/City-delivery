-- ============================================
-- INVENTORY RESERVATION SYSTEM
-- Паттерн: Uber Eats / DoorDash / Instacart
-- ============================================

-- Таблица для резервирования товаров
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  dark_store_id INTEGER NOT NULL REFERENCES dark_stores(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_reservations_expires 
  ON inventory_reservations(expires_at) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reservations_product_store 
  ON inventory_reservations(product_id, dark_store_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reservations_user 
  ON inventory_reservations(user_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_reservations_status 
  ON inventory_reservations(status);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reservation_updated_at
  BEFORE UPDATE ON inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_updated_at();

-- Функция для очистки просроченных резерваций (cron job)
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- 1. Обновить статус просроченных резерваций
  WITH expired AS (
    UPDATE inventory_reservations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING product_id, dark_store_id, quantity
  )
  -- 2. Вернуть товары в inventory
  UPDATE inventory i
  SET reserved_quantity = reserved_quantity - e.quantity,
      updated_at = NOW()
  FROM (
    SELECT product_id, dark_store_id, SUM(quantity) as quantity
    FROM expired
    GROUP BY product_id, dark_store_id
  ) e
  WHERE i.product_id = e.product_id
    AND i.dark_store_id = e.dark_store_id;
  
  -- Получить количество обработанных
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Добавить колонку reserved_quantity в inventory (если еще нет)
ALTER TABLE inventory 
  ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0);

-- Индекс для быстрого поиска свободных товаров
CREATE INDEX IF NOT EXISTS idx_inventory_free_quantity 
  ON inventory((available_quantity - reserved_quantity)) 
  WHERE (available_quantity - reserved_quantity) > 0;

-- Комментарии для документации
COMMENT ON TABLE inventory_reservations IS 'Резервирование товаров для предотвращения overbooking';
COMMENT ON COLUMN inventory_reservations.expires_at IS 'Время автоматической отмены (TTL 15 минут)';
COMMENT ON COLUMN inventory_reservations.status IS 'active: активна, completed: подтверждена заказом, expired: истекла, cancelled: отменена';
COMMENT ON COLUMN inventory.reserved_quantity IS 'Количество зарезервированных товаров (недоступно для новых заказов)';

-- Создать cron job для автоматической очистки (если используется pg_cron)
-- SELECT cron.schedule('cleanup-expired-reservations', '*/5 * * * *', 'SELECT expire_old_reservations()');

-- Пример использования:
-- 1. Резервирование: INSERT INTO inventory_reservations (product_id, dark_store_id, user_id, quantity)
-- 2. Подтверждение: UPDATE inventory_reservations SET status = 'completed', order_id = X
-- 3. Отмена: UPDATE inventory_reservations SET status = 'cancelled'
-- 4. Автоматическая очистка: SELECT expire_old_reservations() (каждые 5 минут)

