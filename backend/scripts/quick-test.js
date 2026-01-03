/**
 * Быстрый тест API без базы данных
 * Проверяет что сервер запускается и маршруты работают
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Быстрое тестирование API...\n');

  try {
    // Тест 1: Health check
    console.log('1️⃣  Тест Health Check...');
    const health = await testEndpoint('/api/health');
    if (health.status === 200) {
      console.log('   ✅ Health check работает');
    } else {
      console.log('   ❌ Health check не работает:', health.status);
      return;
    }

    // Тест 2: Получение товаров (может не работать без БД)
    console.log('\n2️⃣  Тест получения товаров...');
    try {
      const products = await testEndpoint('/api/products');
      if (products.status === 200) {
        console.log('   ✅ API товаров работает');
        console.log(`   📦 Найдено товаров: ${products.data.count || 0}`);
      } else if (products.status === 500) {
        console.log('   ⚠️  API работает, но БД не подключена');
        console.log('   💡 Запустите: node src/database/test-connection.js');
      } else {
        console.log('   ❌ Ошибка:', products.status);
      }
    } catch (error) {
      console.log('   ⚠️  Ошибка подключения к БД (это нормально если БД не запущена)');
    }

    // Тест 3: Регистрация (без БД не сработает)
    console.log('\n3️⃣  Тест регистрации...');
    try {
      const register = await testEndpoint('/api/auth/register', 'POST', {
        email: 'test@test.com',
        password: 'test123',
        name: 'Test User',
      });
      if (register.status === 201) {
        console.log('   ✅ Регистрация работает');
      } else if (register.status === 500) {
        console.log('   ⚠️  API работает, но БД не подключена');
      } else {
        console.log('   ⚠️  Статус:', register.status, register.data.error || '');
      }
    } catch (error) {
      console.log('   ⚠️  Ошибка (возможно БД не запущена)');
    }

    console.log('\n✅ Базовые тесты завершены!');
    console.log('\n💡 Следующие шаги:');
    console.log('   1. Убедитесь что PostgreSQL запущен');
    console.log('   2. Создайте .env файл с настройками БД');
    console.log('   3. Примените схему: psql city_delivery < src/database/schema.sql');
    console.log('   4. Проверьте подключение: node src/database/test-connection.js');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Сервер не запущен!');
      console.log('💡 Запустите: npm run dev');
    } else {
      console.log('❌ Ошибка:', error.message);
    }
  }
}

runTests();

