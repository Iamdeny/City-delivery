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
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Проверьте:');
      console.error('   1. PostgreSQL запущен?');
      console.error('   2. Правильные ли настройки в .env?');
      console.error('   3. База данных создана?');
    } else if (error.code === '3D000') {
      console.error('\n💡 База данных не существует!');
      console.error('   Создайте: createdb city_delivery');
    } else if (error.code === '28P01') {
      console.error('\n💡 Неверный пароль!');
      console.error('   Проверьте DB_PASSWORD в .env');
    }
    
    process.exit(1);
  }
}

testConnection();

