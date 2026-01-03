-- ============ ПЛАТЕЖИ ============
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) UNIQUE, -- Внутренний ID платежа
    yukassa_id VARCHAR(255) UNIQUE, -- ID платежа в ЮKassa
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, canceled, failed
    payment_method VARCHAR(50), -- card, cash, apple_pay, google_pay
    confirmation_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_yukassa_id ON payments(yukassa_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Добавляем payment_status в orders, если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
    END IF;
END $$;

