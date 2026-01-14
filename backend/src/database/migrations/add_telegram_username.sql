-- Миграция: Добавление полей telegram_id и telegram_username для Telegram авторизации
-- Дата создания: 2024
-- Описание: Добавляет поля для хранения Telegram ID и username пользователя

-- Добавляем поля telegram_id и telegram_username, если их еще нет
DO $$
BEGIN
    -- Проверяем и добавляем telegram_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_id BIGINT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
        RAISE NOTICE '✅ Добавлено поле telegram_id';
    ELSE
        RAISE NOTICE 'ℹ️  Поле telegram_id уже существует';
    END IF;

    -- Проверяем и добавляем telegram_username
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'telegram_username'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_username VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_users_telegram_username ON users(telegram_username);
        RAISE NOTICE '✅ Добавлено поле telegram_username';
    ELSE
        RAISE NOTICE 'ℹ️  Поле telegram_username уже существует';
    END IF;
END $$;

-- Выводим информацию о структуре таблицы users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
    AND column_name IN ('telegram_id', 'telegram_username')
ORDER BY column_name;
