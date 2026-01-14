/**
 * Скрипт для проверки подключения к базе данных
 * Запуск: node src/database/test-connection.js
 */

require('dotenv').config();
const { query } = require('../config/database');

async function testConnection() {
  try {
    console.log('🔍 Проверка подключения к базе данных...');
    console.log(`📊 Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'city_delivery'}`);
    
    // Простой запрос для проверки
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ Подключение успешно!');
    console.log(`⏰ Текущее время БД: ${result.rows[0].current_time}`);
    console.log(`📦 PostgreSQL версия: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Проверка существования таблиц
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  ВНИМАНИЕ: Таблицы не найдены!');
      console.log('💡 Запустите: psql city_delivery < backend/src/database/schema.sql');
    } else {
      console.log(`\n📋 Найдено таблиц: ${tablesResult.rows.length}`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:');
    console.error(`   ${error.message}`);
    if (error.code) {
      console.error(`   Код ошибки: ${error.code}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL не доступен!');
      console.error('   Возможные причины:');
      console.error('   1. Docker не запущен - запустите Docker Desktop');
      console.error('   2. Контейнер PostgreSQL не запущен');
      console.error('      Решение: docker-compose up -d postgres');
      console.error('   3. Неправильный DB_HOST в .env');
    } else if (error.code === '3D000') {
      console.error('\n💡 База данных не существует!');
      console.error('   Создайте базу данных:');
      console.error('   docker exec -i city-delivery-postgres-1 psql -U admin -d postgres -c "CREATE DATABASE city_delivery;"');
    } else if (error.code === '28P01') {
      console.error('\n💡 Неверный пароль!');
      console.error('   Проверьте DB_PASSWORD в backend/.env');
      console.error('   Пароль должен совпадать с POSTGRES_PASSWORD в docker-compose.yml');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('\n💡 Не удается найти хост базы данных!');
      console.error('   Проверьте DB_HOST в backend/.env');
      console.error('   Для Docker используйте: localhost (если на хосте) или postgres (если в контейнере)');
    } else {
      console.error('\n💡 Дополнительная информация:');
      console.error(`   Тип ошибки: ${error.name || 'Unknown'}`);
      console.error(`   Код: ${error.code || 'N/A'}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    }
    
    console.error('\n📋 Текущие настройки подключения:');
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   Port: ${process.env.DB_PORT || 5432}`);
    console.error(`   Database: ${process.env.DB_NAME || 'city_delivery'}`);
    console.error(`   User: ${process.env.DB_USER || 'admin'}`);
    console.error(`   Password: ${process.env.DB_PASSWORD ? 'SET (' + process.env.DB_PASSWORD.length + ' chars)' : 'NOT SET'}`);
    
    process.exit(1);
  }
}

testConnection();

