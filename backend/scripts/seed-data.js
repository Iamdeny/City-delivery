/**
 * Скрипт для добавления тестовых данных в базу
 * Запуск: node scripts/seed-data.js
 */

require('dotenv').config();
const { query, getClient } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function seedData() {
  console.log('🌱 Начало заполнения тестовыми данными...\n');

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Создание тестового склада
    console.log('1️⃣  Создание тестового склада...');
    const storeResult = await client.query(
      `INSERT INTO dark_stores (
        name, address, latitude, longitude, 
        phone, delivery_radius, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [
        'Центральный склад',
        'ул. Центральная, д. 1',
        55.7558, // Москва (можно изменить на свой город)
        37.6173,
        '+7 (999) 123-45-67',
        5000, // 5 км радиус
        true,
      ]
    );

    let storeId;
    if (storeResult.rows.length > 0) {
      storeId = storeResult.rows[0].id;
      console.log(`   ✅ Склад создан (ID: ${storeId})`);
    } else {
      // Если склад уже существует, получаем его ID
      const existingStore = await client.query(
        'SELECT id FROM dark_stores WHERE name = $1',
        ['Центральный склад']
      );
      storeId = existingStore.rows[0].id;
      console.log(`   ℹ️  Склад уже существует (ID: ${storeId})`);
    }

    // 2. Создание тестовых товаров
    console.log('\n2️⃣  Создание тестовых товаров...');
    const products = [
      { name: 'Молоко 3.2%', price: 89, category: 'Молочные продукты', image: '🥛', stock: 100 },
      { name: 'Хлеб Бородинский', price: 45, category: 'Хлеб', image: '🍞', stock: 50 },
      { name: 'Яйца 10 шт', price: 120, category: 'Яйца', image: '🥚', stock: 80 },
      { name: 'Сыр Российский', price: 350, category: 'Сыры', image: '🧀', stock: 30 },
      { name: 'Вода 1.5л', price: 60, category: 'Напитки', image: '💧', stock: 200 },
      { name: 'Колбаса Докторская', price: 280, category: 'Колбасы', image: '🌭', stock: 40 },
      { name: 'Помидоры', price: 150, category: 'Овощи', image: '🍅', stock: 60 },
      { name: 'Бананы', price: 90, category: 'Фрукты', image: '🍌', stock: 70 },
      { name: 'Кофе растворимый', price: 450, category: 'Кофе/Чай', image: '☕', stock: 25 },
      { name: 'Сахар 1кг', price: 85, category: 'Бакалея', image: '🍚', stock: 100 },
    ];

    let productsCreated = 0;
    for (const product of products) {
      const result = await client.query(
        `INSERT INTO products (
          name, price, category, image, 
          dark_store_id, in_stock, stock_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          product.name,
          product.price,
          product.category,
          product.image,
          storeId,
          true,
          product.stock,
        ]
      );

      if (result.rows.length > 0) {
        productsCreated++;
      }
    }
    console.log(`   ✅ Создано товаров: ${productsCreated}/${products.length}`);

    // 3. Создание тестового пользователя (клиент)
    console.log('\n3️⃣  Создание тестового пользователя...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['customer@test.com', hashedPassword, 'Тестовый Клиент', '+7 (999) 111-11-11', 'customer']
    );

    if (userResult.rows.length > 0) {
      console.log(`   ✅ Клиент создан: ${userResult.rows[0].email}`);
      console.log(`   🔑 Пароль: 123456`);
    } else {
      console.log(`   ℹ️  Клиент уже существует: customer@test.com`);
    }

    // 4. Создание тестового курьера
    console.log('\n4️⃣  Создание тестового курьера...');
    const courierPassword = await bcrypt.hash('courier123', 10);
    
    const courierUserResult = await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['courier@test.com', courierPassword, 'Тестовый Курьер', '+7 (999) 222-22-22', 'courier']
    );

    if (courierUserResult.rows.length > 0) {
      const courierUserId = courierUserResult.rows[0].id;
      await client.query(
        `INSERT INTO couriers (user_id, vehicle_type, is_active)
         VALUES ($1, $2, $3)`,
        [courierUserId, 'bike', true]
      );
      console.log(`   ✅ Курьер создан: courier@test.com`);
      console.log(`   🔑 Пароль: courier123`);
    } else {
      console.log(`   ℹ️  Курьер уже существует: courier@test.com`);
    }

    // 5. Создание тестового сборщика
    console.log('\n5️⃣  Создание тестового сборщика...');
    const pickerPassword = await bcrypt.hash('picker123', 10);
    
    const pickerUserResult = await client.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['picker@test.com', pickerPassword, 'Тестовый Сборщик', '+7 (999) 333-33-33', 'picker']
    );

    if (pickerUserResult.rows.length > 0) {
      const pickerUserId = pickerUserResult.rows[0].id;
      await client.query(
        `INSERT INTO order_pickers (user_id, dark_store_id, is_active)
         VALUES ($1, $2, $3)`,
        [pickerUserId, storeId, true]
      );
      console.log(`   ✅ Сборщик создан: picker@test.com`);
      console.log(`   🔑 Пароль: picker123`);
    } else {
      console.log(`   ℹ️  Сборщик уже существует: picker@test.com`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Тестовые данные успешно добавлены!');
    console.log('\n📋 Тестовые аккаунты:');
    console.log('   Клиент:   customer@test.com / 123456');
    console.log('   Курьер:   courier@test.com / courier123');
    console.log('   Сборщик:  picker@test.com / picker123');
    console.log('\n💡 Теперь можно протестировать API!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Ошибка при заполнении данными:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Запуск
seedData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });

