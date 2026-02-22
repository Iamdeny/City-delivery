-- Добавление таблицы популярных товаров
CREATE TABLE IF NOT EXISTS popular_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    score NUMERIC(10,3) NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_popular_products_rank ON popular_products(rank);
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_products_product_id ON popular_products(product_id);