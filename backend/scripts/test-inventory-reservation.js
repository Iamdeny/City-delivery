/**
 * Тестовый скрипт для проверки Inventory Reservation System
 * Запуск: node scripts/test-inventory-reservation.js
 */

const inventoryService = require('../src/services/inventoryService');
const { query, getClient } = require('../src/config/database');
const logger = require('../src/utils/logger');

async function testInventoryReservation() {
  console.log('\n🧪 ТЕСТ INVENTORY RESERVATION SYSTEM\n');
  console.log('═'.repeat(60));
  
  try {
    // Тест 1: Проверка подключения к БД
    console.log('\n✅ Тест 1: Подключение к БД');
    const dbCheck = await query('SELECT NOW()');
    console.log('   База данных доступна:', dbCheck.rows[0].now);
    
    // Тест 2: Проверка наличия таблиц
    console.log('\n✅ Тест 2: Проверка таблиц');
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('inventory_reservations', 'inventory', 'dark_stores', 'products')
      ORDER BY table_name
    `);
    
    const existingTables = tablesCheck.rows.map(r => r.table_name);
    console.log('   Найденные таблицы:', existingTables);
    
    if (!existingTables.includes('inventory_reservations')) {
      console.log('\n❌ ОШИБКА: Таблица inventory_reservations не найдена');
      console.log('   Примените schema: psql city_delivery < backend/src/database/inventory_schema.sql');
      return;
    }
    
    // Тест 3: Создать тестовый склад (если нет)
    console.log('\n✅ Тест 3: Подготовка тестовых данных');
    let darkStoreId;
    const storeCheck = await query('SELECT id FROM dark_stores LIMIT 1');
    if (storeCheck.rows.length > 0) {
      darkStoreId = storeCheck.rows[0].id;
      console.log('   Используем существующий склад:', darkStoreId);
    } else {
      const storeResult = await query(`
        INSERT INTO dark_stores (name, address, latitude, longitude, delivery_radius, is_active)
        VALUES ('Тестовый склад', 'Тестовый адрес', 55.751244, 37.618423, 5, true)
        RETURNING id
      `);
      darkStoreId = storeResult.rows[0].id;
      console.log('   Создан тестовый склад:', darkStoreId);
    }
    
    // Тест 4: Создать тестовые продукты (если нет)
    let productIds = [];
    const productsCheck = await query('SELECT id FROM products LIMIT 2');
    if (productsCheck.rows.length >= 2) {
      productIds = productsCheck.rows.map(r => r.id);
      console.log('   Используем существующие продукты:', productIds);
    } else {
      const product1 = await query(`
        INSERT INTO products (name, price, category, in_stock)
        VALUES ('Тестовый продукт 1', 100, 'test', true)
        RETURNING id
      `);
      const product2 = await query(`
        INSERT INTO products (name, price, category, in_stock)
        VALUES ('Тестовый продукт 2', 200, 'test', true)
        RETURNING id
      `);
      productIds = [product1.rows[0].id, product2.rows[0].id];
      console.log('   Созданы тестовые продукты:', productIds);
    }
    
    // Тест 5: Инициализация stock в products
    console.log('\n✅ Тест 5: Инициализация stock в products');
    for (const productId of productIds) {
      await query(`
        UPDATE products 
        SET stock_quantity = 100, 
            reserved_quantity = 0,
            dark_store_id = $2
        WHERE id = $1
      `, [productId, darkStoreId]);
      console.log(`   Обновлен stock для продукта ${productId}: 100 шт.`);
    }
    
    // Тест 6: Резервирование товаров
    console.log('\n✅ Тест 6: Резервирование товаров');
    const testUserId = 1; // ID тестового пользователя
    const items = [
      { productId: productIds[0], quantity: 5 },
      { productId: productIds[1], quantity: 3 }
    ];
    
    const reservation = await inventoryService.reserve(
      items,
      testUserId,
      darkStoreId,
      60 // 1 minute TTL для теста
    );
    
    if (reservation.success) {
      console.log('   ✅ Резервация успешна!');
      console.log('   Reservation IDs:', reservation.reservationIds);
      console.log('   Expires At:', reservation.expiresAt);
      
      // Проверяем reserved_quantity в products
      const productsAfter = await query(
        'SELECT id, stock_quantity, reserved_quantity FROM products WHERE dark_store_id = $1',
        [darkStoreId]
      );
      console.log('   Состояние products после резервации:');
      productsAfter.rows.forEach(row => {
        console.log(`     Продукт ${row.id}: stock=${row.stock_quantity}, reserved=${row.reserved_quantity}`);
      });
      
      // Тест 7: Подтверждение резервации
      console.log('\n✅ Тест 7: Подтверждение резервации');
      const fakeOrderId = 9999; // Фейковый ID заказа
      const confirmResult = await inventoryService.confirm(reservation.reservationIds, fakeOrderId);
      
      if (confirmResult.success) {
        console.log('   ✅ Резервация подтверждена!');
        console.log('   Confirmed:', confirmResult.confirmed);
        
        // Проверяем статус в БД
        const reservationStatus = await query(
          'SELECT id, status, order_id FROM inventory_reservations WHERE id = ANY($1::int[])',
          [reservation.reservationIds]
        );
        console.log('   Статус резерваций:');
        reservationStatus.rows.forEach(row => {
          console.log(`     ID ${row.id}: status=${row.status}, order_id=${row.order_id}`);
        });
      } else {
        console.log('   ❌ Ошибка подтверждения:', confirmResult.error);
      }
      
      // Тест 8: Очистка (опционально)
      console.log('\n✅ Тест 8: Очистка тестовых данных');
      await query('DELETE FROM inventory_reservations WHERE id = ANY($1::int[])', [reservation.reservationIds]);
      await query('UPDATE products SET reserved_quantity = 0 WHERE dark_store_id = $1', [darkStoreId]);
      console.log('   Тестовые резервации удалены');
      
    } else {
      console.log('   ❌ Ошибка резервации:', reservation.error);
      if (reservation.unavailableItems) {
        console.log('   Недоступные товары:', reservation.unavailableItems);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!\n');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА В ТЕСТАХ:', error);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Запуск тестов
testInventoryReservation();

