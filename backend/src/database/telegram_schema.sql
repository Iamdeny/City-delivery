-- ============ TELEGRAM MINI APP SCHEMA ============

-- Telegram пользователи
CREATE TABLE IF NOT EXISTS telegram_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для telegram_users
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);

-- Система лояльности
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    level VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для loyalty_points
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- История кешбэка
CREATE TABLE IF NOT EXISTS cashback_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id),
    points_earned INTEGER NOT NULL,
    points_spent INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для cashback_history
CREATE INDEX IF NOT EXISTS idx_cashback_history_user_id ON cashback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_history_order_id ON cashback_history(order_id);
CREATE INDEX IF NOT EXISTS idx_cashback_history_created_at ON cashback_history(created_at);

-- Адреса пользователей (для малых населенных пунктов)
CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    settlement VARCHAR(255),        -- Название населенного пункта
    district VARCHAR(255),          -- Район
    street VARCHAR(255),
    house VARCHAR(50),
    apartment VARCHAR(50),
    entrance VARCHAR(50),            -- Подъезд
    floor VARCHAR(50),               -- Этаж
    comment TEXT,                    -- Комментарий (ориентиры)
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для user_addresses
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(is_default);

-- Расширение таблицы products для Telegram Mini App
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_halal BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'all'; -- 'north_caucasus', 'all'

-- Индексы для новых полей products
CREATE INDEX IF NOT EXISTS idx_products_is_halal ON products(is_halal);
CREATE INDEX IF NOT EXISTS idx_products_is_local ON products(is_local);
CREATE INDEX IF NOT EXISTS idx_products_region ON products(region);
