-- Таблица для событий рекомендаций
CREATE TABLE IF NOT EXISTS recommendation_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL, -- 'impression' или 'click'
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),        -- для неавторизованных
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendation_events_created_at ON recommendation_events(created_at);
CREATE INDEX idx_recommendation_events_product ON recommendation_events(product_id);