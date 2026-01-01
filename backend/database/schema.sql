-- ============ ТЕМНЫЙ МАГАЗИН (DARK STORE) ============
CREATE TABLE dark_stores (
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

-- Ячейки хранения (для оптимизации сборки)
CREATE TABLE storage_cells (
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
CREATE TABLE order_pickers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    dark_store_id INTEGER REFERENCES dark_stores(id),
    is_active BOOLEAN DEFAULT true,
    current_order_id INTEGER REFERENCES orders(id),
    last_seen TIMESTAMP DEFAULT NOW(),
    performance_rating DECIMAL(3, 2) DEFAULT 5.0
);

-- ============ КУРЬЕРЫ ============
CREATE TABLE couriers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    vehicle_type VARCHAR(50), -- 'bike', 'scooter', 'car'
    vehicle_number VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    current_order_id INTEGER REFERENCES orders(id),
    rating DECIMAL(3, 2) DEFAULT 5.0,
    completed_orders INTEGER DEFAULT 0,
    last_seen TIMESTAMP DEFAULT NOW()
);

-- ============ МАРШРУТЫ ДОСТАВКИ ============
CREATE TABLE delivery_routes (
    id SERIAL PRIMARY KEY,
    courier_id INTEGER REFERENCES couriers(id),
    dark_store_id INTEGER REFERENCES dark_stores(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    total_distance DECIMAL(10, 2), -- в км
    status VARCHAR(50) DEFAULT 'planned'
);

CREATE TABLE route_points (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES delivery_routes(id),
    order_id INTEGER REFERENCES orders(id),
    sequence_number INTEGER NOT NULL,
    estimated_arrival TIME,
    actual_arrival TIME
);

-- ============ АНАЛИТИКА ============
CREATE TABLE analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    dark_store_id INTEGER REFERENCES dark_stores(id),
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    avg_delivery_time INTEGER, -- в минутах
    peak_hour TIME,
    most_popular_product_id INTEGER REFERENCES products(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dark_store ON orders(dark_store_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_storage_cells_product ON storage_cells(product_id);
CREATE INDEX idx_couriers_location ON couriers(current_location_lat, current_location_lng);