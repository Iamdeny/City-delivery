-- Миграция: Добавление полей для Telegram авторизации
-- Выполнить: psql -U postgres -d city_delivery -f add_telegram_fields.sql

-- Добавляем поля telegram_id и telegram_avatar, если их еще нет
DO $$
BEGIN
    -- Проверяем и добавляем telegram_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_id BIGINT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        RAISE NOTICE 'Добавлено поле telegram_id';
    END IF;

    -- Проверяем и добавляем telegram_avatar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'telegram_avatar'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_avatar VARCHAR(500);
        RAISE NOTICE 'Добавлено поле telegram_avatar';
    END IF;
END $$;
