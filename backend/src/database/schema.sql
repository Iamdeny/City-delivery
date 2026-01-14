-- ============ ПОЛЬЗОВАТЕЛИ ============
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    telegram_id BIGINT UNIQUE, -- Telegram user ID (для авторизации через Telegram)
    telegram_avatar VARCHAR(500), -- URL аватара из Telegram
    role VARCHAR(50) DEFAULT 'customer', -- customer, courier, picker, admin, manager
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ ТЕМНЫЕ МАГАЗИНЫ (DARK STORES) ============
-- Создаем ПЕРВЫМ, так как на него ссылаются другие таблицы
CREATE TABLE IF NOT EXISTS dark_stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    opening_time TIME DEFAULT '08:00:00',
    closing_time TIME DEFAULT '22:00:00',
    delivery_radius INTEGER DEFAULT 5000, -- радиус в метрах
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ ТОВАРЫ ============
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image VARCHAR(500),
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ ЗАКАЗЫ ============
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) NOT NULL,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    picker_id INTEGER, -- Добавим внешний ключ позже
    courier_id INTEGER, -- Добавим внешний ключ позже
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    client_latitude DECIMAL(10, 8),
    client_longitude DECIMAL(11, 8),
    comment TEXT,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    -- pending, preparing, picking, ready, assigned_to_courier, 
    -- picked_up, delivering, delivered, cancelled
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ ПОЗИЦИИ ЗАКАЗА ============
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- цена на момент заказа
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ ЯЧЕЙКИ ХРАНЕНИЯ (для оптимизации сборки) ============
CREATE TABLE IF NOT EXISTS storage_cells (
    id SERIAL PRIMARY KEY,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    zone VARCHAR(50) NOT NULL, -- 'Холодильник', 'Морозилка', 'Сухой', 'Хрупкое'
    row INTEGER NOT NULL,
    shelf INTEGER NOT NULL,
    cell_number VARCHAR(20) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER DEFAULT 0,
    UNIQUE(dark_store_id, zone, row, shelf, cell_number)
);

-- ============ СБОРЩИКИ ЗАКАЗОВ ============
CREATE TABLE IF NOT EXISTS order_pickers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    is_active BOOLEAN DEFAULT true,
    current_order_id INTEGER REFERENCES orders(id),
    last_seen TIMESTAMP DEFAULT NOW(),
    performance_rating DECIMAL(3, 2) DEFAULT 5.0,
    completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ КУРЬЕРЫ ============
CREATE TABLE IF NOT EXISTS couriers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50), -- 'bike', 'scooter', 'car', 'walking'
    vehicle_number VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    current_order_id INTEGER REFERENCES orders(id),
    rating DECIMAL(3, 2) DEFAULT 5.0,
    completed_orders INTEGER DEFAULT 0,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ МАРШРУТЫ ДОСТАВКИ ============
CREATE TABLE IF NOT EXISTS delivery_routes (
    id SERIAL PRIMARY KEY,
    courier_id INTEGER REFERENCES couriers(id),
    dark_store_id INTEGER REFERENCES dark_stores(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_distance DECIMAL(10, 2), -- в км
    status VARCHAR(50) DEFAULT 'planned' -- planned, active, completed, cancelled
);

CREATE TABLE IF NOT EXISTS route_points (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES delivery_routes(id),
    order_id INTEGER REFERENCES orders(id),
    sequence_number INTEGER NOT NULL,
    estimated_arrival TIME,
    actual_arrival TIME
);

-- ============ УВЕДОМЛЕНИЯ ============
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- order_status, new_order, system
    title VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB, -- дополнительные данные
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ АНАЛИТИКА ============
CREATE TABLE IF NOT EXISTS analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    avg_delivery_time INTEGER, -- в минутах
    peak_hour TIME,
    most_popular_product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, dark_store_id)
);

-- ============ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ============
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_dark_store ON orders(dark_store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_picker ON orders(picker_id);

CREATE INDEX IF NOT EXISTS idx_storage_cells_product ON storage_cells(product_id);
CREATE INDEX IF NOT EXISTS idx_storage_cells_store ON storage_cells(dark_store_id);

CREATE INDEX IF NOT EXISTS idx_couriers_location ON couriers(current_location_lat, current_location_lng);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active, current_order_id);

CREATE INDEX IF NOT EXISTS idx_pickers_store ON order_pickers(dark_store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pickers_active ON order_pickers(is_active, current_order_id);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(dark_store_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ============ ТРИГГЕРЫ ============
-- Автоматическое обновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ ДОБАВЛЕНИЕ ВНЕШНИХ КЛЮЧЕЙ ПОСЛЕ СОЗДАНИЯ ВСЕХ ТАБЛИЦ ============
ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_picker FOREIGN KEY (picker_id) REFERENCES order_pickers(id),
    ADD CONSTRAINT fk_orders_courier FOREIGN KEY (courier_id) REFERENCES couriers(id);

