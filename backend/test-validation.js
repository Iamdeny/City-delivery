/**
 * Скрипт для тестирования валидации
 */

const http = require('http');

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(body),
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 ТЕСТИРОВАНИЕ ВАЛИДАЦИИ\n');
  console.log('='.repeat(50));

  // Тест 1: Невалидный пароль (слишком короткий)
  console.log('\n📝 Тест 1: Невалидный пароль (слишком короткий)');
  try {
    const response = await makeRequest('/api/auth/register', 'POST', {
      email: 'test@test.com',
      password: '123',
      name: 'Test User',
    });
    
    if (response.statusCode === 400) {
      console.log('✅ Валидация работает!');
      console.log('   Статус:', response.statusCode);
      console.log('   Ошибка:', response.body.error);
      console.log('   Детали:', JSON.stringify(response.body.details, null, 2));
    } else {
      console.log('❌ Неожиданный статус:', response.statusCode);
    }
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
  }

  // Тест 2: Невалидный email
  console.log('\n📝 Тест 2: Невалидный email');
  try {
    const response = await makeRequest('/api/auth/register', 'POST', {
      email: 'invalid-email',
      password: 'ValidPass1!',
      name: 'Test User',
    });
    
    if (response.statusCode === 400) {
      console.log('✅ Валидация работает!');
      console.log('   Статус:', response.statusCode);
      console.log('   Ошибка:', response.body.error);
      console.log('   Детали:', JSON.stringify(response.body.details, null, 2));
    } else {
      console.log('❌ Неожиданный статус:', response.statusCode);
    }
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
  }

  // Тест 3: Отсутствующие поля
  console.log('\n📝 Тест 3: Отсутствующие обязательные поля');
  try {
    const response = await makeRequest('/api/auth/register', 'POST', {
      email: 'test@test.com',
    });
    
    if (response.statusCode === 400) {
      console.log('✅ Валидация работает!');
      console.log('   Статус:', response.statusCode);
      console.log('   Ошибка:', response.body.error);
      console.log('   Детали:', JSON.stringify(response.body.details, null, 2));
    } else {
      console.log('❌ Неожиданный статус:', response.statusCode);
    }
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
  }

  // Тест 4: Валидный запрос (должен пройти валидацию, но может упасть на существующем пользователе)
  console.log('\n📝 Тест 4: Валидный запрос');
  try {
    const response = await makeRequest('/api/auth/register', 'POST', {
      email: 'valid@test.com',
      password: 'ValidPass1!',
      name: 'Test User',
      phone: '+7 (999) 123-45-67',
    });
    
    if (response.statusCode === 201 || response.statusCode === 409) {
      console.log('✅ Валидация пройдена!');
      console.log('   Статус:', response.statusCode);
      if (response.statusCode === 409) {
        console.log('   Примечание: Пользователь уже существует (это нормально для теста)');
      } else {
        console.log('   Успех:', response.body.success);
      }
    } else {
      console.log('❌ Неожиданный статус:', response.statusCode);
      console.log('   Ответ:', response.body);
    }
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Тестирование завершено!\n');
}

// Ждем 3 секунды перед запуском, чтобы сервер успел запуститься
setTimeout(() => {
  runTests().catch(console.error);
}, 3000);

console.log('⏳ Ожидание запуска сервера...');

